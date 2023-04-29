import {Vector} from "../geometry/vector";

export const getWindowScrollVector = () =>
  new Vector(window.scrollX, window.scrollY);
