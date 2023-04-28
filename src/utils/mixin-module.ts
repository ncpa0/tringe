import { Module } from "../module";

export const MixinModule = (cls: new () => any) => {
  class Mixin extends cls {
    constructor() {
      super();
      // @ts-ignore
      Module.__initializeDependencies(this);
    }
  }

  Reflect.defineProperty(Mixin, "name", {
    value: cls.name,
  });

  for (const key of Object.getOwnPropertyNames(Module.prototype)) {
    if (key === "constructor") continue;

    Reflect.defineProperty(Mixin.prototype, key, {
      // @ts-ignore
      value: Module.prototype[key],
      enumerable: true,
    });
  }

  for (const key of Object.getOwnPropertyNames(Module)) {
    if (key === "prototype" || key === "name" || key === "length") continue;

    Reflect.defineProperty(Mixin, key, {
      // @ts-ignore
      value: Module[key],
      enumerable: true,
    });
  }

  return Mixin as any;
};
