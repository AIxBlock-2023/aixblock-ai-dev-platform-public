import { httpClient, HttpMethod } from 'workflow-blocks-common';
import { createAction, Property } from 'workflow-blocks-framework';
import { aixblockAuth } from '../../..';
import { getDashboard } from '../dashboard/get-tensorboard';

interface ComputeGpu {
    id: number;
    gpu_name: string;
    gpu_index: number;
    gpu_id: string;
    type: string;
    power_consumption?: string | null;
    gpu_memory?: string;
    gpu_tflops?: string;
    location_name?: string;
    status?: string;
}

interface NetworkHistory {
    id: number;
    ml_network: {
        id: number;
        project_id: number;
        name: string;
        model_id: number;
        type: string;
    };
    status: string;
}

interface MlInfo {
    id: number;
    url: string;
    install_status: string;
    state?: string;
    title?: string;
    status?: string;
    compute_gpu?: ComputeGpu;
    network_history?: NetworkHistory;
    project: number;
    status_training?: string;
}

/**
 * Get ML Network information
 */
async function getMlNetwork(auth: any, projectId: string, modelId?: string): Promise<any> {
    console.log('Getting ML Network...');
    const queryParams: Record<string, string> = {
        project_id: projectId
    };

    if (modelId) {
        queryParams['model_id'] = modelId;
    }
    
    console.log('ML Network query params:', queryParams);

    const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${auth.baseApiUrl}/api/ml/ml-network`,
        headers: {
            Authorization: `Token ${auth.apiToken}`
        },
        queryParams
    });

    console.log('ML Network response:', response.body);
    return response.body;
}

/**
 * Get ML information
 */
async function getMlInfo(auth: any, mlId: string): Promise<MlInfo> {
    console.log('Getting ML Info...');
    const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${auth.baseApiUrl}/api/ml/${mlId}`,
        headers: {
            Authorization: `Token ${auth.apiToken}`
        }
    });
    return response.body as MlInfo;
}

export const train = createAction({
    name: 'train',
    auth: aixblockAuth,
    displayName: 'Train',
    description: 'Train a model',
    props: {
        model_id: Property.Dropdown({
            displayName: 'Model',
            description: 'Select a model to train',
            required: true,
            refreshers: [],
            linkToModelMarketplace: true,
            showUseHuggingFaceOption: false,
            async options({ auth }) {
                // Fix: assert auth type for TypeScript
                const typedAuth = auth as { apiToken: string; baseApiUrl: string };
                // Fetch from both APIs and combine results
                const headers = { Authorization: `Token ${typedAuth.apiToken}` };
                const [marketRes] = await Promise.all([
                    // httpClient.sendRequest({
                    //     method: HttpMethod.GET,
                    //     url: `${typedAuth.baseApiUrl}/api/model_marketplace/list-sell?page=1&page_size=1000`,
                    //     headers
                    // }),
                    httpClient.sendRequest({
                        method: HttpMethod.GET,
                        url: `${typedAuth.baseApiUrl}/api/model_marketplace/?page=1&page_size=1000&status=in_marketplace`,
                        headers
                    })
                ]);
                // Combine and deduplicate by id
                const models = [
                    // ...(sellRes.body?.results || []),
                    ...(marketRes.body?.results || [])
                ];
                const uniqueModels = Object.values(models.reduce((acc, m) => {
                    acc[m.id] = m;
                    return acc;
                }, {}));
                return {
                    // Pass the entire model object as value for richer info downstream
                    options: uniqueModels.map((m: any) => ({ label: m.name, value: JSON.stringify(m) }))
                };
            }
        }),
        dataset: Property.ShortText({
            displayName: 'Dataset location',
            description: 'Support URL, AIxBlock/Hugging Face dataset ID and local path',
            required: false,
            supportUrlPrefix: true,
            supportDatasetIdPrefix: true,
            supportLocalPrefix: true,
        }),
        // ml_network_id: Property.ShortText({
        //     displayName: 'ML Network ID',
        //     description: 'The ID of the ML Network to use. If not provided, the first available network will be used',
        //     required: false,
        // }),
        push_to_hub_token: Property.ShortText({
            displayName: 'HuggingFace Push to Hub Token',
            description: 'Token for pushing trained model to HuggingFace Hub. If provided, the model will be pushed to HuggingFace after training',
            required: true,
        }),
        epochs: Property.Number({
            displayName: 'Epochs',
            description: 'Number of epochs for training',
            required: false,
            defaultValue: 10,
        }),
        batch_size: Property.Number({
            displayName: 'Batch Size',
            description: 'Batch size for training',
            required: false,
            defaultValue: 32,
        }),
        learning_rate: Property.Number({
            displayName: 'Learning Rate',
            description: 'Learning rate for training',
            required: false,
            defaultValue: 0.001,
        }),
        wait_until_installed: Property.Checkbox({
            displayName: 'Wait Until Installed',
            description: 'Wait until the ML model is fully installed before training',
            required: false,
            defaultValue: true,
        }),
    },
    async run({ auth, propsValue }) {
        try {
            // Log all props for debugging
            console.log('Props values:', JSON.stringify(propsValue));

            // 1. Call list-build-model API to get current built models
            const buildModelRes = await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: `${auth.baseApiUrl}/api/model_marketplace/list-build-model?page=1&page_size=1000&type=rent`,
                headers: { Authorization: `Token ${auth.apiToken}` },
            });
            const buildModels = buildModelRes.body?.results || [];
            const builtWithCompute = buildModels.filter((bm: any) => bm.model_marketplace && bm.model_marketplace.related_compute !== null);
            console.log('Built with compute:', builtWithCompute);
            // Try to find a built model with the selected model_id
            // Parse selected model info from dropdown value
            const selectedModel = typeof propsValue.model_id === 'string' ? JSON.parse(propsValue.model_id) : propsValue.model_id;
            console.log('Selected model:', selectedModel);
            let selectedBuild = builtWithCompute.find((bm: any) => bm.model_marketplace.model_id == selectedModel.model_id || bm.model_marketplace.id == selectedModel.id);
            let mlIdToUse: number | null = null;

            if (selectedBuild) {
                // Use the ml_id from the built model
                mlIdToUse = selectedBuild.model_marketplace.ml_id;
                console.log('Selected build:', selectedBuild);
            } else {
                // Not built, replicate logic from add-model.ts
                // 1. Create a new project
                const now = new Date();
                const pad = (n: number) => n.toString().padStart(2, '0');
                const title = `Project ${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
                const projectBody = {
                    title,
                    color: "#a2a2a2",
                    label_config: "<View>\n  <Header value=\"Please read the text\" />\n  </View>\n\n\n",
                    label_config_title: "",
                    annotation_template: null,
                    template_id: 24,
                    type: {},
                    epochs: 1,
                    batch_size: 1,
                    image_width: 64,
                    image_height: 64,
                    flow_type: "fine-tune-and-deploy"
                };
                const projectRes = await httpClient.sendRequest({
                    method: HttpMethod.POST,
                    url: `${auth.baseApiUrl}/api/projects/`,
                    body: projectBody,
                    headers: {
                        Authorization: `Token ${auth.apiToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                const project_id = projectRes.body.id;
                // 2. Link or create S3 storage
                const storagesRes = await httpClient.sendRequest({
                    method: HttpMethod.GET,
                    url: `${auth.baseApiUrl}/api/storages/global`,
                    headers: { Authorization: `Token ${auth.apiToken}` }
                });
                let storageLinked = false;
                if (Array.isArray(storagesRes.body)) {
                    for (const storage of storagesRes.body) {
                        if (storage.storage_type === 's3') {
                            try {
                                await httpClient.sendRequest({
                                    method: HttpMethod.POST,
                                    url: `${auth.baseApiUrl}/api/storages/link-global/${project_id}/${storage.id}/s3`,
                                    headers: { Authorization: `Token ${auth.apiToken}` }
                                });
                                storageLinked = true;
                                break;
                            } catch (e) {}
                        }
                    }
                }
                if (!storageLinked) {
                    await httpClient.sendRequest({
                        method: HttpMethod.POST,
                        url: `${auth.baseApiUrl}/api/storages/s3-server`,
                        body: {
                            regex_filter: `raw_files_${project_id}`,
                            use_blob_urls: true,
                            recursive_scan: false,
                            presign: true,
                            presign_ttl: "60",
                            storage_type: "s3-server",
                            project: project_id
                        },
                        headers: { Authorization: `Token ${auth.apiToken}`, 'Content-Type': 'application/json' }
                    });
                }
                // 3. Select GPU
                const availableGpus = await httpClient.sendRequest({
                    method: HttpMethod.GET,
                    url: `${auth.baseApiUrl}/api/compute_marketplace/gpus`,
                    headers: { Authorization: `Token ${auth.apiToken}` },
                    queryParams: {
                        project_id: project_id,
                        is_using: "0",
                        compute_type: 'model-training'
                    }
                });
                const gpusArr = availableGpus.body;
                if (!gpusArr.length || !gpusArr[0].compute_gpus.length) {
                    throw new Error('No available GPUs found');
                }
                const selectedGpu = gpusArr[Math.floor(Math.random() * gpusArr.length)];
                const gpu = selectedGpu.compute_gpus[Math.floor(Math.random() * selectedGpu.compute_gpus.length)];
                console.log('Selected GPU:', gpu);
                // 4. GPU details
                const gpuResponse = await httpClient.sendRequest({
                    method: HttpMethod.GET,
                    url: `${auth.baseApiUrl}/api/compute_gpu`,
                    queryParams: {
                        project_id: project_id,
                        paramaster: 'check',
                        gpu_list_id: gpu.id
                    },
                    headers: { Authorization: `Token ${auth.apiToken}` }
                });
                console.log('GPU details:', gpuResponse.body);

                // 5. Build PATCH body using model info and GPU
                const patchBody: any = {
                    name: selectedModel.name,
                    author_id: selectedModel.author_id,
                    is_buy_least: true,
                    project_id: project_id,
                    gpus: [{
                        compute_id: selectedGpu.compute_id,
                        gpus_id: gpu.id.toString(),
                        machine_options: 'virtual-machines',
                    }],
                    config: { framework: 'huggingface' },
                    project: {},
                    calculate_compute_gpu: gpuResponse.body,
                    estimate_time: '1',
                    estimate_cost: '0.159',
                    rent_time: '1',
                    rent_cost: '0.159',
                    weight: '',
                    modeltype: 'training',
                };

                console.log('PATCH body:', patchBody);
                // PATCH /api/model_marketplace/update/id
                await httpClient.sendRequest({
                    method: HttpMethod.PATCH,
                    url: `${auth.baseApiUrl}/api/model_marketplace/update/${selectedModel.id}`,
                    headers: { Authorization: `Token ${auth.apiToken}`, 'Content-Type': 'application/json' },
                    body: patchBody
                });
                // After PATCH, fetch ml_id from history-deploy-list (like add-model.ts)
                const deployListRes = await httpClient.sendRequest({
                    method: HttpMethod.GET,
                    url: `${auth.baseApiUrl}/api/ml/history-deploy-list`,
                    queryParams: {
                        project: project_id
                    },
                    headers: { Authorization: `Token ${auth.apiToken}` }
                });
                let deployList: { id: number; install_status: string }[] = [];
                if (Array.isArray(deployListRes.body)) {
                    deployList = deployListRes.body.map((item: any) => ({
                        id: item.id,
                        install_status: item.install_status ?? item.state
                    }));
                }
                if (!deployList.length) throw new Error('No deploys found after model update');
                mlIdToUse = deployList[0].id;
            }
            
            console.log('ML ID to use:', mlIdToUse);
            // Always fetch mlInfo for the ml_id to use
            let mlInfo = await getMlInfo(auth, mlIdToUse!.toString());

            // Wait for install if requested
            const waitUntilInstalled = propsValue.wait_until_installed === undefined ? true : propsValue.wait_until_installed;
            console.log('Waiting for install...', waitUntilInstalled);
            if (waitUntilInstalled) {
                while (mlInfo.install_status === 'installing') {
                    await new Promise(res => setTimeout(res, 30000)); // 30s
                    mlInfo = await getMlInfo(auth, mlIdToUse!.toString());
                }
                if (mlInfo.install_status === 'completed') {
                    await new Promise(res => setTimeout(res, 10000)); // 10s extra wait
                }
            }

            // Check if the model is still installing
            if (!mlInfo) {
                throw new Error('ML Info not found');
            }
            
            if (mlInfo.install_status === 'installing') {
                console.log('ML Info status: installing');
                return { status: 'installing', message: 'The model is still being installed. Please try again later.' };
            }

            // If model is already training, return immediately
            if (mlInfo.status_training === 'training') {
                const { tensorboard_url, ml_url, dashboard_url } = await getDashboard(String(mlIdToUse), auth.baseApiUrl, auth.apiToken)
                return {
                    status: 'success',
                    message: 'Training initiated successfully',
                    response: {
                        ml_id: mlIdToUse,
                        status: mlInfo.status,
                        status_training: mlInfo.status_training
                    },
                    tensorboard: {
                        tensorboard_url,
                        ml_url,
                        dashboard_url
                    }
                };
            }

            // Optionally upload dataset from localFilePath, then use latest dataset as before
            if (propsValue.dataset && propsValue.dataset.trim() !== '') {
                const axios = require('axios');
                const fs = require('fs');
                const data = new (require('form-data'))();
                data.append('project_id', mlInfo.project);
                
                // Upload dataset file to project
                if (propsValue.dataset.startsWith("local:")) {
                    data.append('file', fs.createReadStream(propsValue.dataset.substring(6)));
                } else if (propsValue.dataset.startsWith("url:")) {
                    data.append('type_dataset', "url");
                    data.append('url', propsValue.dataset.substring(4));
                } else if (propsValue.dataset.startsWith("id:")) {
                    data.append('type_dataset', "hugging-face");
                    data.append('dataset_path', propsValue.dataset.substring(3));
                }

                const uploadConfig = {
                    method: 'post',
                    maxBodyLength: Infinity,
                    url: `${auth.baseApiUrl}/api/import/upload-dataset`,
                    headers: {
                        Authorization: `Token ${auth.apiToken}`,
                        ...data.getHeaders(),
                    },
                    data: data,
                };
                await axios.request(uploadConfig);
            }
            
            // Use latest dataset as before
            try {
                const datasetListResponse = await httpClient.sendRequest({
                    method: HttpMethod.GET,
                    url: `${auth.baseApiUrl}/api/dataset_model_marketplace/?project_id=${mlInfo.project}`,
                    headers: {
                        Authorization: `Token ${auth.apiToken}`,
                        'Accept': 'application/json'
                    },
                    responseType: 'json'
                });
                const datasetList = datasetListResponse.body;
                if (!Array.isArray(datasetList) || datasetList.length === 0) {
                    throw new Error('No datasets found for this project');
                }
                // Assume the first dataset is the latest (API returns sorted by created_at desc)
                const latestDataset = datasetList[0];
                const latestDatasetId = latestDataset.id;
                // Patch the latest dataset as the active dataset
                const datasetResponse = await httpClient.sendRequest({
                    method: HttpMethod.PATCH,
                    url: `${auth.baseApiUrl}/api/dataset_model_marketplace/${latestDatasetId}`,
                    headers: {
                        Authorization: `Token ${auth.apiToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: {
                        project_id: mlInfo.project
                    }
                });
                console.log('Latest dataset selection response:', datasetResponse.body);
            } catch (datasetError) {
                console.error('Error selecting latest dataset:', datasetError);
                throw new Error(`Failed to select latest dataset: ${datasetError instanceof Error ? datasetError.message : String(datasetError)}`);
            }
            

            // HuggingFace integration: use mlInfo.project as project_id if needed
            if (propsValue.push_to_hub_token && mlInfo.project) {
                console.log('HuggingFace Push to Hub token provided, updating project settings...');
                try {
                    const projectUpdateEndpoint = `${auth.baseApiUrl}/api/projects/${mlInfo.project}`;
                    const projectUpdateResponse = await httpClient.sendRequest({
                        method: HttpMethod.PATCH,
                        url: projectUpdateEndpoint,
                        headers: {
                            Authorization: `Token ${auth.apiToken}`,
                            'Content-Type': 'application/json'
                        },
                        body: {
                            checkpoint_storage: 'huggingface',
                            checkpoint_storage_huggingface: propsValue.push_to_hub_token,
                            epochs: propsValue.epochs || 10
                        }
                    });
                    console.log('Project settings updated for HuggingFace integration:', projectUpdateResponse.status);
                } catch (huggingFaceError) {
                    console.error('Error updating project for HuggingFace:', huggingFaceError);
                    // Continue with training even if HuggingFace setup fails
                }
            }

            // Start training
            console.log('Starting training...');
            
            // Prepare body parameters for training
            const bodyParams = {
                epochs: propsValue.epochs || 10,
                batch_size: propsValue.batch_size || 32,
                learning_rate: propsValue.learning_rate || 0.001
            };
            
            console.log('Training request body:', JSON.stringify(bodyParams));
            
            const trainResponse = await httpClient.sendRequest({
                method: HttpMethod.POST,
                url: `${auth.baseApiUrl}/api/ml/${mlIdToUse!.toString()}/train`,
                headers: {
                    Authorization: `Token ${auth.apiToken}`,
                    'Content-Type': 'application/json'
                },
                body: bodyParams
            });
            console.log('Training initiated');

            const tensorboard_info = {
                tensorboard_url: '',
                ml_url: '',
                dashboard_url: ''
            }
            if (trainResponse.body.ml_id) {
                const info = await getDashboard(trainResponse.body.ml_id, auth.baseApiUrl, auth.apiToken)
                tensorboard_info.tensorboard_url = info.tensorboard_url;
                tensorboard_info.ml_url = info.ml_url;
                tensorboard_info.dashboard_url = info.dashboard_url;
            }
            return {
                status: 'success',
                message: 'Training initiated successfully',
                response: trainResponse.body,
                tensorboard: tensorboard_info,
            };
        } catch (error) {
            console.error('Training error:', error);
            return { status: 'error', message: error instanceof Error ? error.message : String(error) };
        }
    },
});
