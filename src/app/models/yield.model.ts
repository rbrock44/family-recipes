import {Yield} from './yield.interface';

export class YieldModel implements Yield {
  name: string = '';
  amount: number = 0;

  public constructor(init?: Partial<YieldModel>) {
    Object.assign(this, init);
  }
}
