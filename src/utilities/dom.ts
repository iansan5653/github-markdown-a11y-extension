import {Vector} from "./vector";

export const getWindowScrollVector = () =>
  new Vector(window.scrollX, window.scrollY);
