import { SPUCateID, SpuID, SPUState, SPU } from '@zsqk/z1-sdk/es/z1p/alltypes';
import { getSPUCateBaseList, getSPUListNew } from '@zsqk/z1-sdk/es/z1p/product';
import constate from 'constate';
import { useCallback, useEffect, useMemo, useReducer, useTransition, useState } from 'react';
import { getAwait, lessAwait } from '../error';

// ============= SPU 状态类型定义 =============
interface SPUListState {
  list: SPU[];
  isPending: boolean;
  currentPage: number;
  pageSize: number;
  hasMore: boolean;
  nameKeyword: string;
  selectedSpuId: SpuID | undefined;
}

type SPUListAction =
  | { type: 'SET_LIST'; payload: SPU[] }
  | { type: 'SET_PENDING'; payload: boolean }
  | { type: 'SET_PAGE'; payload: { page: number; hasMore: boolean } }
  | { type: 'SET_KEYWORD'; payload: string }
  | { type: 'SET_SELECTED_SPU_ID'; payload: SpuID | undefined }
  | { type: 'RESET' };

function spuListReducer(state: SPUListState, action: SPUListAction): SPUListState {
  switch (action.type) {
    case 'SET_LIST':
      return { ...state, list: action.payload };
    case 'SET_PENDING':
      return { ...state, isPending: action.payload };
    case 'SET_PAGE':
      return {
        ...state,
        currentPage: action.payload.page,
        hasMore: action.payload.hasMore,
      };
    case 'SET_KEYWORD':
      return { ...state, nameKeyword: action.payload };
    case 'SET_SELECTED_SPU_ID':
      return { ...state, selectedSpuId: action.payload };
    case 'RESET':
      return {
        ...state,
        list: [],
        currentPage: 1,
        hasMore: true,
        nameKeyword: '',
        selectedSpuId: undefined,
      };
    default:
      return state;
  }
}

const initialSpuListState: SPUListState = {
  list: [],
  isPending: false,
  currentPage: 1,
  pageSize: 100,
  hasMore: true,
  nameKeyword: '',
  selectedSpuId: undefined,
};

// ============= SPU 分类 ID Hook =============
function useSPUCateID() {
  const [spuCateID, setSelected] = useState<SPUCateID | undefined>(undefined);
  const setSpuCateID = useCallback((v: SPUCateID | undefined) => setSelected(v), []);
  return { spuCateID, setSpuCateID };
}

// ============= SPU 分类列表 Hook =============
function useSPUCateList() {
  const [spuCateList, setSPUCateList] = useState<
    Awaited<ReturnType<typeof getSPUCateBaseList>>
  >([]);

  const update = useCallback(
    () =>
      getAwait(async () => {
        const d = await getSPUCateBaseList().catch(err => {
          console.error('可能为网络错误', err);
          return [];
        });
        setSPUCateList(d);
      }, { showSuccess: false })(),
    []
  );

  useEffect(() => {
    update();
  }, [update]);

  const contextValue = useMemo(
    () => ({ spuCateList, setSPUCateList, reUpdate: update }),
    [spuCateList, update]
  );

  return contextValue;
}

export const [SPUCateListProvider, useSPUCateListContext] =
  constate(useSPUCateList);

/**
 * @author Lian Zheren <lzr@go0356.com>
 */
export function useSPUCateListUpdate() {
  const { reUpdate } = useSPUCateListContext();
  const fn = useCallback(reUpdate, [reUpdate]);
  return fn;
}

// ============= 合并后的 SPU Hook (使用 useReducer) =============
function useSpu() {
  const { spuCateID } = useSPUCateIDContext();

  const [state, dispatch] = useReducer(spuListReducer, initialSpuListState);

  const loadPage = useCallback((page: number, keyword?: string) => {
    dispatch({ type: 'SET_PENDING', payload: true });

    lessAwait(async () => {
      const pageSize = 100;
      const offset = (page - 1) * pageSize;
      const kw = keyword !== undefined ? keyword : state.nameKeyword;

      const d = await getSPUListNew(
        {
          ...(spuCateID ? { cateIDs: [spuCateID] } : {}),
          ...(kw ? { nameKeyword: kw } : {}),
          states: [SPUState.在用],
          limit: pageSize,
          offset,
          orderBy: [
            { key: 'p."order"', sort: 'DESC' },
            { key: 'p."id"', sort: 'DESC' }
          ],
        },
        ['id', 'name', 'brand', 'series', 'generation', 'order']
      );

      dispatch({ type: 'SET_LIST', payload: d as SPU[] });
      dispatch({
        type: 'SET_PAGE',
        payload: { page, hasMore: d.length === pageSize },
      });
      dispatch({ type: 'SET_KEYWORD', payload: kw });
      dispatch({ type: 'SET_PENDING', payload: false });
      dispatch({ type: 'SET_SELECTED_SPU_ID', payload: undefined });
    }, { showSuccess: false })();
  }, [spuCateID, state.nameKeyword]);

  const update = useCallback(() => {
    loadPage(1);
  }, [loadPage]);

  const setSpuID = useCallback((id: SpuID | undefined) => {
    dispatch({ type: 'SET_SELECTED_SPU_ID', payload: id });
  }, []);

  const setNameKeyword = useCallback((kw: string) => {
    dispatch({ type: 'SET_KEYWORD', payload: kw });
  }, []);

  // 当分类变化时，重新加载
  useEffect(() => {
    update();
  }, [update]);

  // 使用 useMemo 稳定 Context 值
  const contextValue = useMemo(() => ({
    // 状态
    spuList: state.list,
    isPending: state.isPending,
    currentPage: state.currentPage,
    pageSize: state.pageSize,
    hasMore: state.hasMore,
    nameKeyword: state.nameKeyword,
    spuID: state.selectedSpuId,
    // 操作
    setSpuID,
    loadPage,
    refresh: update,
    setNameKeyword,
  }), [state, setSpuID, loadPage, update]);

  return contextValue;
}

export const [SpuProvider, useSpuContext] = constate(useSpu);

// 兼容旧 API 的别名
export const SpuIDProvider = SpuProvider;
export const SPUListProvider = SpuProvider;

// 导出单独的 hook 供兼容旧代码
export function useSpuIDContext() {
  const { spuID, setSpuID } = useSpuContext();
  return { spuID, setSpuID };
}

export function useSpuListContext() {
  const ctx = useSpuContext();
  return {
    spuList: ctx.spuList,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setSpuList: (_list: any) => { /* 废弃方法，SPU添加后会自动刷新 */ },
    isPending: ctx.isPending,
    currentPage: ctx.currentPage,
    pageSize: ctx.pageSize,
    hasMore: ctx.hasMore,
    loadPage: ctx.loadPage,
    nameKeyword: ctx.nameKeyword,
    setNameKeyword: ctx.setNameKeyword,
    refresh: ctx.refresh,
  };
}

// ============= 单独导出 SPU Cate ID Provider =============
export const [SPUCateIDProvider, useSPUCateIDContext] = constate(useSPUCateID);
