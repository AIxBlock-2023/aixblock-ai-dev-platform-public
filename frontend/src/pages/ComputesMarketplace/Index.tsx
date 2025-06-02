import {useCallback, useEffect, useMemo, /*useRef,*/ useState} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { infoDialog } from "@/components/Dialog";
// import Pagination from "@/components/Pagination/Pagination";
import { TpropsCompute } from "@/hooks/admin/compute/useCompute";
import { useUserLayout } from "@/layouts/UserLayout";
import { useApi } from "@/providers/ApiProvider";
import { useBooleanLoader, usePromiseLoader } from "@/providers/LoaderProvider";
import FilterBox from "./FilterBox/FilterBox";
import "./Index.scss";
import Modal from "@/components/Modal/Modal";
import Deposit from "./Deposit/Deposit";
import { useAuth } from "@/providers/AuthProvider";
import { useGetListComputeMarket } from "./FetchListComputes";
import VpsItem from "./VpsItem/VpsItem";
import Cart from "./Cart/Cart";
import { TOKEN_NAME_DEFAULT, TOKEN_SYMBOL_DEFAULT } from "@/constants/projectConstants";
import useUserPortfolio from "@/hooks/user/useUserPortfolio";

export interface SelectedOption {
  tokenSymbol: string;
  label: string;
  services: string;
  results: any;
  id: string;
  gpu_name: string;
  price: number;
  quantity: number;
  totalPrice: number;
  ids: string[];
  vast_contract_id?: number;
  provider_name?: string;
  is_cpu?: boolean;
  hours: number,
}

const Marketplace = () => {
  const savedCart = useMemo(() => {
    const serializedItems = localStorage.getItem("selectedCard");

    if (typeof serializedItems !== "string") {
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

  const api = useApi();
  // const auth = useAuth();
  const userLayout = useUserLayout();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = searchParams.get("page");
  const navigate = useNavigate();
  const [filterParams, setFilterParams] = useState<TpropsCompute | null>(null);
  // const [isOpenModalCaluted, setIsOpenModalCaluted] = useState(false);
  // const [timeValue, setTimeValue] = useState<string>("");
  // eslint-disable-next-line
  // const [isOpenModalConfirm, setIsOpenModalConfirm] = useState(false);
  const [isDeposit, setIsDeposit] = useState(false);
  // const [rentalInfo, setRentalInfo] = useState({});
  // const [idCompute, setIdCompute] = useState(0);
  const [isOpenModalWaiting, setIsOpenModalWaiting] = useState(false);
  const [selectedCard, setSelectedCard] = useState<SelectedOption[]>(savedCart);
  const {balance} = useUserPortfolio(TOKEN_SYMBOL_DEFAULT);
  const {user} = useAuth();

  // const refTotalPrice = useRef(0)
  // const refHours = useRef('')

  const { computes, /*page, pageSize, setPage,*/ loading, error, fetchData } =
    useGetListComputeMarket({
      page: currentPage ? Number(currentPage) : 1,
      type: filterParams?.type,
      min_price: filterParams?.min_price,
      max_price: filterParams?.max_price,
      startDate: filterParams?.startDate,
      endDate: filterParams?.endDate,
      location: filterParams?.location,
    });

  const isNotFound =
    !computes || !computes.results || computes?.results.length === 0;

  const onChangeFilter = (field: string, val: string | number) => {
    setFilterParams({ ...filterParams, [field]: val });
    searchParams.set(field, val as string);
    setSearchParams(searchParams);
  };

  const onClearFilter = () => {
    setSearchParams((prevSearchParams) => {
      const newSearchParams = new URLSearchParams(prevSearchParams);
      newSearchParams.delete("sort");
      return newSearchParams;
    });
    setFilterParams(null);
  };

  const { addPromise } = usePromiseLoader();

  useBooleanLoader(loading, "Loading list rented...");

  useEffect(() => {
    userLayout.setBreadcrumbs([
      { label: "Rent from decentralized compute marketplace" },
    ]);
    return () => {
      userLayout.clearBreadcrumbs();
    };
  }, [userLayout]);

  useEffect(() => {
    if (!error || error.length === 0) {
      return;
    }

    infoDialog({ message: error });
  }, [error]);

  useEffect(() => {
    userLayout.setQualityInCart(selectedCard.length || 0)
  }, [selectedCard, userLayout])

  const rentCompute = async () => {
    if (!user) {
      return;
    }

    setIsOpenModalWaiting(true);

    const computeGPUs: {id: string, hours: number, type: string}[] = [];
    const computeVast: {id: string, hours: number, type: string}[] = [];
    const computeCPU: {id: string, hours: number, type: string}[] = [];

    selectedCard.forEach(c => {
      if (c.is_cpu) {
        computeCPU.push({id: c.id, hours: c.hours, type: c.services});
        return;
      }

      if (c.vast_contract_id) {
        computeVast.push({id: c.id, hours: c.hours, type: c.services});
        return;
      }

      for (let i = 0; i < Math.min(c.quantity, c.ids.length); i++) {
        computeGPUs.push({id: c.ids[i], hours: c.hours, type: c.services});
      }
    })

    const body = {
      token_name: TOKEN_NAME_DEFAULT,
      token_symbol: TOKEN_SYMBOL_DEFAULT,
      price: selectedCard.reduce((v, c) => v + (c.price * c.quantity * c.hours), 0),
      account: user.id,
      compute_gpus_rent: computeGPUs,
      compute_rent_vast: computeVast,
      compute_cpus_rent: computeCPU,
    }

    const ar = api.call("rentComputeV2Api", {body});

    addPromise(ar.promise, "Processing... Please wait a moment!");

    ar.promise.then(async (r) => {
      try {
        if (r.ok) {
          setSelectedCard([])
          localStorage.removeItem('selectedCard')
          navigate("/computes");
        } else {
          const data = await r.json();

          if (Object.hasOwn(data, "detail")) {
            infoDialog({ message: data.detail });
          } else {
            infoDialog({ message: r.statusText });
          }
          fetchData()
        }
      } catch (error) {

      } finally {
        setIsOpenModalWaiting(false)
        localStorage.setItem('apiCallFinished', 'true');
      }
    });
  };


  const handleRent = useCallback((_: number, selectedOptions: SelectedOption[]) => {
    // refTotalPrice.current = selectedOptions.reduce((accumulator, currentGpu) => accumulator + currentGpu.totalPrice || currentGpu.price, 0);
    // const rentalInfoSelect: RentalInfo = {
    //   compute_gpus_id: selectedOptions.flatMap(item => item.id).join(','),
    //   vast_contract_id: selectedOptions.flatMap(item => item.vast_contract_id).join(','),
    //   token_name: TOKEN_NAME_DEFAULT,
    //   token_symbol: TOKEN_SYMBOL_DEFAULT,
    //   price: refTotalPrice.current,
    //   account: auth.user?.id as any,
    //   hours: refHours.current || timeValue
    // }

    // setIdCompute(id)
    // console.log(idCompute)
    // setRentalInfo(rentalInfoSelect)
    // setIsOpenModalCaluted(true);
    // refTotalPrice.current = selectedOptions.reduce((accumulator, currentGpu) => accumulator + currentGpu.totalPrice || currentGpu.price, 0);
    // const rentalInfoSelect: RentalInfo = {
    //   compute_gpus_id: selectedOptions.flatMap(item => item.ids).join(','),
    //   compute_id: id,
    //   token_name: TOKEN_NAME_DEFAULT,
    //   token_symbol: TOKEN_SYMBOL_DEFAULT,
    //   price: refTotalPrice.current,
    //   account: auth.user?.id as any,
    //   hours: refHours.current || timeValue
    // }

    setSelectedCard((prev) => {
      const existingIds = new Set(prev.map(item => item.id)); // assuming each item has a unique 'id' field
      const newItems = selectedOptions.filter(item => !existingIds.has(item.id));
      return [...prev, ...newItems];
    });

    userLayout.setOpenCart(true)

    // setIdCompute(id)
    // setRentalInfo(rentalInfoSelect)
    // setIsOpenModalCaluted(true);
  }, [userLayout]);

  const handleDeleteCardInCart = (itemId: string) => {
    setSelectedCard(prevItems => {
      return prevItems.filter(item => item.id !== itemId);
    });

  }

  // const handleBuy = () => {
  //   console.log('selectedCard', selectedCard);
  //
  //   const joinedIds = selectedCard.map(item => item.id).join(',');
  //
  //   // Tính tổng giá tiền của tất cả các mục
  //   const totalPrice = selectedCard.reduce((sum, item) => sum + item.price, 0);
  //
  //   const rentalInfoSelect: RentalInfo = {
  //     compute_gpus_id: '4',
  //     // compute_gpus_id: selectedCard.flatMap((item: { ids: any; }) => item.ids).join(','),
  //     // compute_id: '9',
  //     token_name: TOKEN_NAME_DEFAULT,
  //     token_symbol: TOKEN_SYMBOL_DEFAULT,
  //     price: totalPrice,
  //     account: auth.user?.id as any,
  //     hours: totalPrice.toString()
  //   }
  //   // const newRentInfo = { ...rentalInfo, hours: refHours.current || timeValue }
  //   setRentalInfo(rentalInfoSelect)
  //   console.log('rentalInfoSelect', rentalInfoSelect);
  //
  //   setIsDeposit(true)
  //   setIsOpenModalConfirm(false)
  //   // setRentalInfo(newRentInfo)
  //   // rentCompute(rentalInfoSelect);
  // }

  const handleChangeInputHours = (value: string, id: string) => {
    setSelectedCard(list => list.map((card) => {
      if (card.id === id) {
        return { ...card, hours: Math.max(Math.ceil(parseFloat(value)), 1) };
      }
      return card;
    }));
  }

  const handleChangeInputQuality = (value: string, id: string) => {
    setSelectedCard(list => list.map((card) => {
      if (card.id === id) {
        return { ...card, quantity: Math.max(Math.ceil(parseFloat(value)), 1) };
      }
      return card;
    }));
  }

  const handleChangeServices = (value: string, id: string) => {
    setSelectedCard(list => list.map((card) => {
      if (card.id === id) {
        return { ...card, services: value };
      }
      return card;
    }));
  }

  const computeItems = useMemo(() => computes?.results[0].compute.map((item, index) => {
    return (
      <VpsItem key={index} item={item} label={String(item.gpu_name)} onHandleRent={handleRent} />
    )
  }), [computes, handleRent]);

  const computeCpuItems = useMemo(() => computes?.results[1].compute_cpu.map(item => {
    return ((
      <VpsItem key={item.id} item={item} label={item.name} isCPU={true} onHandleRent={handleRent} />
    ))
  }), [computes, handleRent]);

  useEffect(() => {
    localStorage.setItem("selectedCard", JSON.stringify(selectedCard));
  }, [selectedCard]);

  return (
    !isDeposit ? <div className="c-marketplace">
      <div className="c-marketplace__content">
        <div className="c-marketplace__header">
          <FilterBox
            headerText={
              <div className="c-marketplace__header__text">
                <span>Computes ({computes?.count ?? 0}) </span>
              </div>
            }
            onChange={(field, val) => onChangeFilter(field, val)}
            filterParams={filterParams}
            setFilterParams={setFilterParams}
            onClearFilter={onClearFilter}
            searchParams={searchParams}
            setSearchParams={setSearchParams}
          />
        </div>

        {isNotFound && <p className="no-results">No compute found</p>}

        <div className="c-marketplace__list">
          {computeItems}
          {computeCpuItems}
        </div>
        {/* {computes?.results && computes?.count > 1 && (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={computes?.count ?? 1}
            setPage={setPage}
            target="computes/computes-marketplace"
          />
        )} */}
      </div>

      <Cart 
        onHandleChangeHours={handleChangeInputHours} 
        onHandleChangeQuality={handleChangeInputQuality}
        onHandleServices={handleChangeServices} 
        selectedCard={selectedCard} 
        setIsDeposit={setIsDeposit} 
        onHandleDelete={handleDeleteCardInCart} />
      <Modal
        displayClose={false}
        className="c-crowds__modal-manager"
        open={isOpenModalWaiting}
      >
        Time for a quick musical interlude! We're setting up Docker containers and environments on the computes just for you.<br /> This process typically takes about 1 minute per compute, although timing can vary based on the internet connection from the GPU provider. <br />We appreciate your patience!
      </Modal>

    </div> : <Deposit priceDetailGPU={0} isMarketPleaces={true} setIsDeposit={setIsDeposit} listCardCharge={selectedCard} onHandleRent={rentCompute} onHandleDeleteCard={handleDeleteCardInCart} balance={balance} />
  );
};

export default Marketplace;
