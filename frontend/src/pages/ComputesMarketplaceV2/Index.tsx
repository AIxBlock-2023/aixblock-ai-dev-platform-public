import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import ComputesMarketplaceV2List from "./List";
import ComputesMarketplaceV2Filter from "./Filter";
import "./Index.scss";
import {DEFAULT_FILTER, TComputeMarketplaceV2Filter, TComputeMarketplaceV2SelectedOption} from "./types";
import useComputesMarketplace from "./useComputesMarketplace";
import Cart from "./Cart/Cart";
import useUserPortfolio from "@/hooks/user/useUserPortfolio";
import {TOKEN_NAME_DEFAULT, TOKEN_SYMBOL_DEFAULT} from "@/constants/projectConstants";
import {useAuth} from "@/providers/AuthProvider";
import {useUserLayout} from "@/layouts/UserLayout";
import Deposit from "../ComputesMarketplace/Deposit/Deposit";
import {infoDialog} from "@/components/Dialog";
import {useApi} from "@/providers/ApiProvider";
import {usePromiseLoader} from "@/providers/LoaderProvider";
import {useNavigate, useParams} from "react-router-dom";
import EmptyContent from "../../components/EmptyContent/EmptyContent";
import Button from "../../components/Button/Button";
import useUrlQuery from "../../hooks/useUrlQuery";
import { toastError, toastSuccess } from "../../utils/toast";
import { getTokenByChainId } from "@/utils/solanaAddress";
import SolanaRpcParticle, { ITransactionResponse } from "@/solanaRPCParticle";
import {
  type SolanaChain,
  useAccount,
  usePublicClient,
  useWallets,
} from "@particle-network/connectkit";

export type TComputeMarketplaceCartDiskSizes = {[k: string]: string};

export default function ComputesMarketplaceV2() {
  const savedCart = useMemo(() => {
    const serializedItems = localStorage.getItem("selectedCard");

    if (!serializedItems) {
      return [];
    }

    try {
      return JSON.parse(serializedItems);
    } catch (e) {
      if (window.APP_SETTINGS.debug) {
        console.error(e);
      }
    }

    return [];
  }, []);

  const queries = useUrlQuery();
  const [filter, setFilter] = React.useState<TComputeMarketplaceV2Filter>(DEFAULT_FILTER);
  const [delayedFilter, setDelayedFilter] = React.useState<TComputeMarketplaceV2Filter>(filter);
  const params = useParams();
  const marketplace = useComputesMarketplace(delayedFilter, {initialPage: parseInt(params["page"] ?? "1"), initialPageSize: 20});
  const filterTimeout = useRef<NodeJS.Timeout>();
  const [isDeposit, setIsDeposit] = useState(false);
  const [cart, setCart] = useState<TComputeMarketplaceV2SelectedOption[]>(savedCart);
  const {balance} = useUserPortfolio(TOKEN_SYMBOL_DEFAULT);
  const {user} = useAuth();
  const userLayout = useUserLayout();
  const api = useApi();
  const {addPromise} = usePromiseLoader()
  const navigate = useNavigate();
  const [diskSizes, setDiskSizes] = React.useState<TComputeMarketplaceCartDiskSizes>({});
  const { isConnected: connectedParticle, chainId, address } = useAccount();
  const [primaryWallet] = useWallets();
  const solanaWallet = primaryWallet?.getWalletClient<SolanaChain>();
  const publicClient = usePublicClient<SolanaChain>();

  useEffect(() => {
    if (queries.has("tflops")) {
      let newTflops = parseFloat(queries.get("tflops") ?? "0");

      if (!isNaN(newTflops)) {
        newTflops = Math.min(Math.max(newTflops, 0), 500);

        setFilter(f => {
          return {...f, tflops: {from: newTflops.toString(), to: typeof f.tflops === "string" ? "500" : f.tflops.to}};
        });
      }
    }

    if (queries.has("per_gpu_ram")) {
      let newGpuRam = parseFloat(queries.get("per_gpu_ram") ?? "1");

      if (!isNaN(newGpuRam)) {
        newGpuRam = Math.min(Math.max(newGpuRam, 1), 4096);

        setFilter(f => {
          return {...f, per_gpu_ram: {from: newGpuRam.toString(), to: typeof f.per_gpu_ram === "string" ? "4096" : f.per_gpu_ram.to}};
        });
      }
    }

    if (queries.has("gpu_total_ram")) {
      let newGpuTotalRam = parseFloat(queries.get("gpu_total_ram") ?? "1");

      if (!isNaN(newGpuTotalRam)) {
        newGpuTotalRam = Math.min(Math.max(newGpuTotalRam, 1), 8192);

        setFilter(f => {
          return {...f, gpu_total_ram: {from: newGpuTotalRam.toString(), to: typeof f.gpu_total_ram === "string" ? "8192" : f.gpu_total_ram.to}};
        });
      }
    }

    if (queries.has("nvlink_bandwidth")) {
      let newNvlinkBandwidth = parseFloat(queries.get("nvlink_bandwidth") ?? "1");

      if (!isNaN(newNvlinkBandwidth)) {
        newNvlinkBandwidth = Math.min(Math.max(newNvlinkBandwidth, 1), 2000000);

        setFilter(f => {
          return {...f, nvlink_bandwidth: {from: newNvlinkBandwidth.toString(), to: typeof f.nvlink_bandwidth === "string" ? "2000000" : f.nvlink_bandwidth.to}};
        });
      }
    }

    if (queries.has("dlp_score")) {
      let newDlpScore = parseFloat(queries.get("dlp_score") ?? "1");

      if (!isNaN(newDlpScore)) {
        newDlpScore = Math.min(Math.max(newDlpScore, 1), 8192);

        setFilter(f => {
          return {...f, dlp_score: {from: newDlpScore.toString(), to: typeof f.dlp_score === "string" ? "8192" : f.dlp_score.to}};
        });
      }
    }
  }, [queries]);

  const addToCart = useCallback((selectedOptions: TComputeMarketplaceV2SelectedOption[]) => {
    setCart((prev) => {
      const existingIds = new Set(prev.map(item => item.id)); // assuming each item has a unique 'id' field
      const newItems = selectedOptions.filter(item => !existingIds.has(item.id));
      const newDiskSizes = newItems.reduce((r, i) => ({...r, [i.id]: filter.disk_size}), {});
      setDiskSizes(p => ({...p, ...newDiskSizes}))

      return [...prev, ...newItems];
    });

    userLayout.setOpenCart(true)
  }, [userLayout, filter.disk_size]);

  const removeCartItem = useCallback((id: string) => {
    setCart(prevItems => {
      return prevItems.filter(item => item.id !== id);
    });

    setDiskSizes(p => {
      const newP = {...p};
      delete newP[id];
      return newP;
    });
  }, []);

  const changeCartItemHours = (value: string, id: string) => {
    setCart(list => list.map((card) => {
      if (card.id === id) {
        return { ...card, hours: Math.max(Math.ceil(parseFloat(value)), 1) };
      }
      return card;
    }));
  }

  const changeCartItemQuantity = (value: string, id: string) => {
    setCart(list => list.map((card) => {
      if (card.id === id) {
        return { ...card, quantity: Math.max(Math.ceil(parseFloat(value)), 1) };
      }
      return card;
    }));
  }

  const changeCartItemServices = (value: string, id: string) => {
    setCart(list => list.map((card) => {
      if (card.id === id) {
        return { ...card, services: value };
      }
      return card;
    }));
  }

  const changeCartItemDiskSize = (value: string, id: string) => {
    setDiskSizes(list => {
      const newList = {...list};
      newList[id] = value;
      return newList;
    });
  }

  const rentCompute = async () => {
    if (!user) {
      return;
    }

    // setIsOpenModalWaiting(true);

    const computeGPUs: {id: string, hours: number, type: string, price: number, diskSize: number}[] = [];
    const computeVast: {id: string, hours: number, type: string, price: number, diskSize: number}[] = [];
    const computeCPU: {id: string, hours: number, type: string, price: number, diskSize: number}[] = [];
    const computeExabit: {id: string, hours: number, type: string, price: number, diskSize: number}[] = [];

    cart.forEach(c => {
      console.log(c)
      if (c.is_cpu) {
        computeCPU.push({id: c.id, hours: c.hours, type: c.services, price: c.price, diskSize: parseFloat(diskSizes[c.id])});
        return;
      }

      if (c.vast_contract_id) {
        computeVast.push({id: c.id, hours: c.hours, type: c.services, price: c.price, diskSize: parseFloat(diskSizes[c.id])});
        return;
      }

      if (c.provider_name === "Exabit") {
        computeExabit.push({id: c.id, hours: c.hours, type: c.services, price: c.price, diskSize: parseFloat(diskSizes[c.id])});
        return;
      }

      for (let i = 0; i < Math.min(c.quantity, c.ids.length); i++) {
        computeGPUs.push({id: c.ids[i], hours: c.hours, type: c.services, price: c.price, diskSize: parseFloat(diskSizes[c.id])});
      }
    })

    const body = {
      token_name: TOKEN_NAME_DEFAULT,
      token_symbol: TOKEN_SYMBOL_DEFAULT,
      price: cart.reduce((v, c) => v + (c.price * c.quantity * c.hours), 0),
      account: user.id,
      compute_gpus_rent: computeGPUs,
      compute_rent_vast: computeVast,
      compute_rent_exabit: computeExabit,
      compute_cpus_rent: computeCPU,
    }

    const ar = api.call("rentComputeV2Api", {body});

    addPromise(ar.promise, "Processing... Please wait a moment!");

    ar.promise.then(async (r) => {
      try {
        if (r.ok) {
          setCart([])
          localStorage.removeItem('selectedCard')
          navigate("/infrastructure/gpu/from-marketplace");

          infoDialog({
            title: "Your compute is being provisioned",
            message: (
              <>
                <p>While we prepare your compute environment, we are setting up the necessary software.</p>
                <p>This process usually takes a few minutes per compute, but the time may vary depending on the internet connection.</p>
                <p>The compute list page will refresh automatically when the setup is finished.</p>
                <p>We appreciate your patience!</p>
              </>
            )
          });
        } else {
          const data = await r.json();

          if (Object.hasOwn(data, "detail")) {
            infoDialog({ message: data.detail });
          } else {
            infoDialog({ message: r.statusText });
          }

          marketplace.refresh();
        }
      } catch (error) {

      } finally {
        // setIsOpenModalWaiting(false)
        localStorage.setItem('apiCallFinished', 'true');
      }
    });
  };

  const rentComputeCrypto = async () => {
    if (!user) {
      return;
    }

    const computeGPUs: {
      id: string;
      hours: number;
      type: string;
      price: number;
      diskSize: number;
    }[] = [];
    const computeVast: {
      id: string;
      hours: number;
      type: string;
      price: number;
      diskSize: number;
    }[] = [];
    const computeCPU: {
      id: string;
      hours: number;
      type: string;
      price: number;
      diskSize: number;
    }[] = [];
    const computeExabit: {
      id: string;
      hours: number;
      type: string;
      price: number;
      diskSize: number;
    }[] = [];

    cart.forEach((c) => {
      console.log(c);
      if (c.is_cpu) {
        computeCPU.push({
          id: c.id,
          hours: c.hours,
          type: c.services,
          price: c.price,
          diskSize: parseFloat(diskSizes[c.id]),
        });
        return;
      }

      if (c.vast_contract_id) {
        computeVast.push({
          id: c.id,
          hours: c.hours,
          type: c.services,
          price: c.price,
          diskSize: parseFloat(diskSizes[c.id]),
        });
        return;
      }

      if (c.provider_name === "Exabit") {
        computeExabit.push({
          id: c.id,
          hours: c.hours,
          type: c.services,
          price: c.price,
          diskSize: parseFloat(diskSizes[c.id]),
        });
        return;
      }

      for (let i = 0; i < Math.min(c.quantity, c.ids.length); i++) {
        computeGPUs.push({
          id: c.ids[i],
          hours: c.hours,
          type: c.services,
          price: c.price,
          diskSize: parseFloat(diskSizes[c.id]),
        });
      }
    });

    if (!solanaWallet || !publicClient || !connectedParticle || !chainId || !address) {
      toastError("Wallet is not connected yet. Please connect your wallet.");
      navigate("/user/wallet");
      return;
    }

    try {
      const rpc = new SolanaRpcParticle(chainId);

      const totalPrice = cart.reduce((v, c) => v + c.price * c.quantity * c.hours, 0);
      if (totalPrice <= 0) {
        toastError("Amount must be greater than 0");
        return;
      }
      const currentBalance = await rpc.getTokenBalance(address, getTokenByChainId(chainId).USDC.address);
      if(parseFloat(currentBalance) < totalPrice) {
        toastError("Insufficient USDC balance");
        return;
      }
      const body = {
        token_name: "crypto",
        token_symbol: "USDC",
        price: cart.reduce((v, c) => v + c.price * c.quantity * c.hours, 0),
        account: user.id,
        compute_gpus_rent: computeGPUs,
        compute_rent_vast: computeVast,
        compute_rent_exabit: computeExabit,
        compute_cpus_rent: computeCPU,
        walletAddress: address,
      };

      if (body.price <= 0) {
        toastError("Amount must be greater than 0");
        return;
      }

      const ar = api.call("rentComputeV2ApiCrypto", { body });

      const response = await ar.promise;
      if (!response.ok) {
        toastError("Send transaction error");
        return;
      }
      console.log("response", response);

      const data: ITransactionResponse = await response.json();
      const sendTransaction = await rpc.signAndSendTransaction(data, solanaWallet);
      console.log("sendTransaction", sendTransaction);
      toastSuccess("Send transaction successfully");

      setCart([]);
      localStorage.removeItem("selectedCard");
      navigate("/infrastructure/gpu/from-marketplace");

      infoDialog({
        title: "Your compute is being provisioned",
        message: (
          <>
            <p>
              While we prepare your compute environment, we are setting up the
              necessary software.
            </p>
            <p>
              This process usually takes a few minutes per compute, but the time
              may vary depending on the internet connection.
            </p>
            <p>
              The compute list page will refresh automatically when the setup is
              finished.
            </p>
            <p>We appreciate your patience!</p>
          </>
        ),
      });
    } catch (error) {
      console.log("sendTransaction error", error);
      toastError("Send transaction error");
    }
  };

  useEffect(() => {
    clearTimeout(filterTimeout.current);

    filterTimeout.current = setTimeout(() => {
      setDelayedFilter(filter);
    }, 1000);

    return () => {
      clearTimeout(filterTimeout.current);
    };
  }, [filter]);

  useEffect(() => {
    userLayout.setQualityInCart(cart.length || 0)
  }, [cart, userLayout]);

  useEffect(() => {
    localStorage.setItem("selectedCard", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    userLayout.setCloseCallback("/infrastructure/gpu/from-marketplace");
    return () => userLayout.clearCloseCallback();
  }, [userLayout]);

  // This auto-scroll to top affect the users experiences if click load more.
  // useEffect(() => {
  //   const content = document.querySelector(".p-computes-marketplace-v2__right");
  //   content?.scrollTo({top: 0, behavior: "smooth"});
  // }, [marketplace.listGpu, marketplace.listCpu]);

  if (marketplace.error) {
    return <EmptyContent message={`An error occurred while loading marketplace list. Error: ${marketplace.error}. Please try again!`} buttons={[
      {
        children: "Retry",
        type: "hot",
        onClick: () => marketplace.refresh(),
      }
    ]} />
  }

  if (isDeposit) {
    return (
      <Deposit
        priceDetailGPU={0}
        isMarketPleaces={true}
        setIsDeposit={setIsDeposit}
        listCardCharge={cart.map(c => ({
          id: c.id,
          price: c.price,
          ids: c.ids,
          totalPrice: c.totalPrice,
          services: c.services,
          label: c.label,
          results: c.specs,
          is_cpu: c.is_cpu,
          quantity: c.quantity,
          vast_contract_id: c.vast_contract_id,
          provider_name: c.provider_name,
          gpu_name: c.gpu_name,
          tokenSymbol: c.tokenSymbol,
          hours: c.hours,
        }))}
        onHandleRent={rentCompute}
        onHandleDeleteCard={removeCartItem}
        balance={balance}
        diskSizes={diskSizes}
        onHandleRentCrypto={rentComputeCrypto}
      />
    );
  }

  return (
    <div className="p-computes-marketplace-v2">
      <div className="p-computes-marketplace-v2__left">
        <ComputesMarketplaceV2Filter
          filter={filter}
          setFilter={setFilter}
        />
      </div>
      <div className="p-computes-marketplace-v2__right">
        {marketplace.total === 0 && marketplace.loading && (
          <EmptyContent message="Loading computes ..." />
        )}
        {marketplace.total === 0 && !marketplace.loading && (
          <EmptyContent message="No compute matched the search criteria." />
        )}
        <ComputesMarketplaceV2List
          listGpu={marketplace.listGpu}
          listCpu={marketplace.listCpu}
          onRent={addToCart}
        />
        {(marketplace.listCpu.length + marketplace.listGpu.length) > 0 && (
          <div className="p-computes-marketplace-v2__load-more">
            <Button
              type="gradient"
              disabled={marketplace.loading}
              onClick={() => marketplace.setPageSize(ps => ps + 10)}
            >
              Load more...
            </Button>
          </div>
        )}
        {(marketplace.listCpu.length + marketplace.listGpu.length) > 0 && marketplace.loading && (
          <div className="p-computes-marketplace-v2__loading">
            Refreshing computes list...
          </div>
        )}
      </div>
      <Cart
        selectedCard={cart}
        setIsDeposit={setIsDeposit}
        onHandleDelete={removeCartItem}
        onHandleChangeHours={changeCartItemHours}
        onHandleChangeQuality={changeCartItemQuantity}
        onHandleChangeDiskSize={changeCartItemDiskSize}
        onHandleServices={changeCartItemServices}
        diskSizes={diskSizes}
      />
    </div>
  );
}
