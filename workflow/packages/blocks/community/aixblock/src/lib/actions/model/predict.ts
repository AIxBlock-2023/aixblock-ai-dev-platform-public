import { httpClient, HttpMethod } from 'workflow-blocks-common';
import { createAction, Property, StoreScope } from 'workflow-blocks-framework';
import { AIxBlockPredictMlUrl } from 'workflow-shared';
import { aixblockAuth } from '../../..';

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



/**
 * Convert image to base64
 */
async function convertImageToBase64(imageUrl: string): Promise<string> {
    const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: imageUrl,
        headers: {
            'Accept': 'application/octet-stream'
        },
        responseType: 'arraybuffer'
    });
    return Buffer.from(response.body as ArrayBuffer).toString('base64');
}

export const predict = createAction({
    name: 'predict',
    auth: aixblockAuth,
    displayName: 'Predict',
    description: 'Make predictions using AI models',
    props: {
        model_id: Property.Dropdown({
            displayName: 'Model',
            description: 'Select a model to train',
            required: true,
            refreshers: [],
            linkToModelMarketplace: true,
            showUseHuggingFaceOption: true,
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
        // source: Property.StaticDropdown({
        //     displayName: 'Model Source',
        //     description: 'Source of the model',
        //     required: false,
        //     options: {
        //         options: [
        //             { label: 'Hugging Face', value: 'huggingface' }
        //         ]
        //     },
        //     defaultValue: 'huggingface'
        // }),
        // ml_network_id: Property.ShortText({
        //     displayName: 'ML Network ID',
        //     description: 'ID of the ML Network to use. Leave empty to auto-select the first available network.',
        //     required: false,
        //     defaultValue: '',
        // }),
        // checkpoint_source: Property.StaticDropdown({
        //     displayName: 'Checkpoint Source',
        //     description: 'Source of the model checkpoint',
        //     required: true,
        //     options: {
        //         options: [
        //             { label: 'Huggingface', value: 'huggingface' },
        //             { label: 'Git', value: 'git' }
        //         ]
        //     }
        // }),
        model_hub_id: Property.ShortText({
            displayName: 'Model ID',
            description: 'Model ID from Hugging Face or AlxBlock (e.g., gpt2, facebook/bart-large-cnn, alx/my-model)',
            required: false,
        }),
        
        model_hub_token: Property.ShortText({
            displayName: 'Model Hub Access Token',
            description: 'Access token for Hugging Face or AlxBlock model hub (if required)',
            required: false,
        }),
        prompt: Property.ShortText({
            displayName: 'Prompt',
            description: 'Text input for LLM or NLP models (required for most LLMs)',
            required: false,
            defaultValue: '',
        }),
        // text: Property.LongText({
        //     displayName: 'Text',
        //     description: 'Text input for LLM/NLP models',
        //     required: false,
        //     defaultValue: '',
        // }),
        // image_source: Property.StaticDropdown({
        //     displayName: 'Image Source',
        //     description: 'Source of the image for CV models',
        //     required: false,
        //     options: {
        //         options: [
        //             { label: 'None', value: 'none' },
        //             { label: 'URL', value: 'url' },
        //             { label: 'File Upload', value: 'file' }
        //         ]
        //     },
        //     defaultValue: 'none',
        // }),
        image_input: Property.ShortText({
            displayName: 'Image Input',
            description: 'URL of the image (required for CV models)',
            required: false,
            defaultValue: '',
        }),
        wait_until_installed: Property.Checkbox({
            displayName: 'Wait Until Installed',
            description: 'Wait until the ML model is fully installed before training',
            required: false,
            defaultValue: true,
        }),
        ml_url: Property.CopyText({
            displayName: 'ML url',
            description: 'ML url will display in here after finished',
            fieldKey: AIxBlockPredictMlUrl
        })
        // token_length: Property.Number({
        //     displayName: 'Token Length',
        //     description: 'Maximum number of tokens to generate',
        //     required: false,
        //     defaultValue: 50,
        // }),
        // confidence_threshold: Property.Number({
        //     displayName: 'Confidence Threshold',
        //     description: 'Confidence threshold for predictions',
        //     required: false,
        //     defaultValue: 0.8,
        // }),
        // iou_threshold: Property.Number({
        //     displayName: 'IOU Threshold',
        //     description: 'Intersection over Union threshold',
        //     required: false,
        //     defaultValue: 0.8,
    },
    async run(context) {
        const { auth, propsValue } = context;
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
            
            // Parse the config JSON string to check model type
            let input_type = 'text'; // Default to text
            try {
                if (selectedModel.config) {
                    const configObj = JSON.parse(selectedModel.config);
                    if (configObj.model_type === 'image') {
                        input_type = 'image';
                    }
                    console.log('Model config:', configObj);
                }
            } catch (e) {
                console.log('Error parsing model config:', e);
            }
            
            console.log('Selected model:', selectedModel);
            console.log('Input type determined:', input_type);
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
                    config: { framework: 'transformers' },
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

            // 2. Determine input type and prepare input
            let image: string | null = null;
            if (propsValue.image_input && propsValue.image_input.trim() !== '') {
                // If image input is provided, treat as computer vision task
                image = await convertImageToBase64(propsValue.image_input);
                console.log('Image input detected, using computer vision mode');
            } else if (propsValue.prompt && propsValue.prompt.trim() !== '') {
                // If only text prompt is provided, treat as text generation task
                console.log('Text input detected, using text generation mode');
            } else {
                throw new Error('Either prompt or image_input must be provided');
            }

            console.log('Preparing prediction request...');

            // Prepare query parameters
            const queryParams = {
                project: mlInfo.project.toString(),
            };

            // Prepare body parameters in the correct format
            const bodyParams = {
                command: 'predict',
                params: {
                    prompt: propsValue.prompt || '',
                    model_id: propsValue.model_hub_id || '',
                    task: 'text-generation',
                    model_type: 'rectanglelabels',
                    image,
                    hf_access_token: propsValue.model_hub_token,
                    project: mlInfo.project.toString(),
                    source: 'huggingface'
                }
            };

            console.log('Prediction request body:', JSON.stringify(bodyParams));

            let ml_url = ''
            // Try prediction, if 500 error, reset ML port and retry (using try/catch)
            let predictionResponse;
            try {
                predictionResponse = await httpClient.sendRequest({
                    method: HttpMethod.POST,
                    url: `${mlInfo.url}/action`,
                    headers: {
                        Authorization: `Token ${auth.apiToken}`
                    },
                    queryParams: queryParams,
                    body: bodyParams
                });
                ml_url = mlInfo.url;
            } catch (err: any) {
                if (err.status === 500) {
                    const { resetMlProxyUrl } = await import('../../common/ml-proxy');
                    const newProxyUrl = await resetMlProxyUrl(auth, mlInfo.project.toString());
                    try {
                        predictionResponse = await httpClient.sendRequest({
                            method: HttpMethod.POST,
                            url: `${newProxyUrl}/action`,
                            headers: {
                                Authorization: `Token ${auth.apiToken}`
                            },
                            queryParams: queryParams,
                            body: bodyParams
                        });
                        ml_url = newProxyUrl;
                    } catch (err2) {
                        throw err2;
                    }
                } else {
                    throw err;
                }
            }
            console.log('Prediction completed');

            const key = `${AIxBlockPredictMlUrl}/flowRunId_${context.run.id}`;
            await context.store.put(key, ml_url, StoreScope.FLOW);
            console.log('Finished to upsert ml_url to store with key', key);

            // Process the response based on detected input type
            if (input_type === 'text') {
                try {
                    const responseData = predictionResponse.body;
                    if (responseData && responseData.result && responseData.result[0] &&
                        responseData.result[0].result && responseData.result[0].result[0] &&
                        responseData.result[0].result[0].value && responseData.result[0].result[0].value.text) {
                        // Extract just the text from the response
                        const text = responseData.result[0].result[0].value.text[0];
                        // Check if text is base64
                        const isBase64 = (() => {
                            if (!text || typeof text !== 'string' || text.length < 16) return false;
                            // Chỉ kiểm tra ký tự base64 và độ dài chia hết cho 4
                            const base64Regex = /^[A-Za-z0-9+/=\r\n]+$/;
                            if (!base64Regex.test(text.replace(/\s/g, ''))) return false;
                            if (text.length % 4 !== 0) return false;
                            try {
                                const buf = Buffer.from(text, 'base64');
                                // Nếu decode ra buffer có độ dài > 0 thì coi là base64 hợp lệ
                                return buf.length > 0;
                            } catch (e) {
                                return false;
                            }
                        })();
                        console.log('Is base64:', isBase64);
                        if (isBase64) {
                            const file = await context.files.write({
                                data: Buffer.from(text, 'base64'),
                                fileName: 'image.png',
                            });
                            return {
                                file,
                                text, // text gốc base64
                            };
                        } else {
                            return {
                                text: text
                            };
                        }
                    }
                } catch (e) {
                    console.log('Error parsing text response:', e);
                }
            } else if (input_type === 'image') {
                try {
                    // Return image detection results with appropriate structure
                    return {
                        detections: predictionResponse.body
                    };
                } catch (e) {
                    console.log('Error parsing image response:', e);
                }
            }

            // Return the full response if it's not an LLM or if parsing failed
            return predictionResponse.body;
        } catch (error) {
            console.error('Prediction error:', error);
            throw error;
        }
    },
});
