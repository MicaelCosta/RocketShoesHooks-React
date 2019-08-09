import { call, select, put, all, takeLatest } from "redux-saga/effects";
import { toast } from "react-toastify";
import api from "../../../services/api";
import history from "../../../services/history";
import { formatPrice } from "../../../util/format";

import { addToCartSuccess, updateAmountSuccess } from "./actions";

// "*" neste contexto é uma funcionalidade do javascript chamada GENERANATOR
//Somelhante ao async, porém com funcionalidades a mais
//yield se torna semelhante ao await
function* addToCart({ id }) {
  const productExists = yield select(state =>
    state.cart.find(p => p.id === id)
  );

  //consulta o stock antes de qualquer alteração
  const stock = yield call(api.get, `/stock/${id}`);

  const stockAmount = stock.data.amount;
  const currentAmount = productExists ? productExists.amount : 0;

  const amount = currentAmount + 1;
  if (amount > stockAmount) {
    toast.error("Quantidade solicitada fora do estoque");
    return;
  }

  if (productExists) {
    yield put(updateAmountSuccess(id, amount));
  } else {
    const response = yield call(api.get, `/products/${id}`);

    const data = {
      ...response.data,
      amount: 1,
      priceFormatted: formatPrice(response.data.price)
    };

    //dispara a action
    yield put(addToCartSuccess(data));
    
    history.push('/cart');
  }
}

function* updateAmount({ id, amount }) {
  if (amount <= 0) return;

  const stock = yield call(api.get, `/stock/${id}`);
  const stockAmount = stock.data.amount;

  if (amount > stockAmount) {
    toast.error("Quantidade solicitada fora do estoque");
    return;
  }
  yield put(updateAmountSuccess(id, amount));
}

//Cria o listen das chamadas das actions
export default all([
  //takeLatest enquanto a chamada a api nao retorna, o saga descarta qualquer outra açao que o usuario fizer
  //para esta funçao
  //takeevery considera todas as açoes de clique
  takeLatest("@cart/ADD_REQUEST", addToCart),
  takeLatest("@cart/UPDATE_AMOUNT_REQUEST", updateAmount)
]);
