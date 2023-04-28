import type { Constructor } from "./inject";
import { MetaKey } from "./metadata";
import { getProtoChain } from "./utils/get-proto-chain";

export interface Injectable {
  __init_module?: (
    dependencies: Dependencies | Map<Injectable, DependencyOverride>
  ) => any;
  new (): any;
}
export type DependencyOverride = Injectable | object;

export type Dependencies = Array<[Constructor, DependencyOverride]>;

const defaultDependencies = new Map<Constructor, InstanceType<Injectable>>();

/**
 * By default each injected dependency is a new instance of the
 * given class. This method allows to either replace the
 * constructor of the dependency with another one, or provide a
 * value that will be injected instead.
 */
export const setDefaultDependency = <T extends Injectable>(
  dependencyConstructor: T,
  instance: InstanceType<T> | T
) => {
  defaultDependencies.set(dependencyConstructor, instance);
};

/** Needed for unit tests. */
export const clearDefaultDependencies = () => defaultDependencies.clear();

function isConstructor(obj: object): obj is Injectable {
  // @ts-expect-error
  return !!obj.prototype && !!obj.prototype.constructor;
}

function initializeDependency(
  dependency: any,
  overrides: Dependencies | Map<Injectable, DependencyOverride>
) {
  if (isConstructor(dependency)) {
    if (dependency.__init_module) {
      return dependency.__init_module(overrides);
    } else {
      return new dependency();
    }
  } else {
    return dependency;
  }
}

export class Module {
  private static __init_module<T extends typeof Module>(
    this: T,
    dependencies: Dependencies | Map<Constructor, DependencyOverride>
  ): InstanceType<T> {
    const orgClassName = this.name;
    const dependenciesOverrides = new Map(dependencies);

    class Module extends (this as any) {
      __dependenciesOverrides() {
        return dependenciesOverrides;
      }
    }

    Reflect.defineProperty(Module, "name", {
      value: orgClassName,
    });

    return new Module() as any;
  }

  private static __initializeDependencies(self: Module) {
    const prototype = Object.getPrototypeOf(self);

    const prototypeChain = getProtoChain(prototype);

    const deps = new Map<any, () => any>();

    for (const proto of prototypeChain) {
      const dependenciesOverrides =
        self.__dependenciesOverrides?.() ?? new Map();

      const keys = Reflect.getOwnMetadata(MetaKey.Keys, proto);

      if (keys) {
        for (const key of keys) {
          const getDefault: () => Injectable = Reflect.getMetadata(
            MetaKey.Inject,
            proto,
            key
          );
          const defaultDependency = getDefault();

          const override = dependenciesOverrides.get(defaultDependency);

          if (override) {
            deps.set(key, () =>
              initializeDependency(override, dependenciesOverrides)
            );
          } else {
            const defaultInstance = defaultDependencies.get(defaultDependency);

            if (defaultInstance) {
              deps.set(key, () =>
                initializeDependency(defaultInstance, dependenciesOverrides)
              );
            } else {
              deps.set(key, () =>
                initializeDependency(defaultDependency, dependenciesOverrides)
              );
            }
          }
        }
      }
    }

    for (const [depKey, get] of deps) {
      Reflect.defineProperty(self, depKey, {
        configurable: true,
        enumerable: true,
        writable: true,
        value: get(),
      });
    }

    return self;
  }

  /**
   * Initialize a Module and injects the provided dependencies
   * into it and it's dependents. When a dependency is not
   * provided but is used by the Module, the default one will be
   * used.
   */
  static di<T extends typeof Module>(
    this: T,
    ...dependencies: Dependencies
  ): InstanceType<T> {
    return this.__init_module(dependencies);
  }

  protected declare __dependenciesOverrides?: () => Map<
    Constructor,
    DependencyOverride
  >;

  constructor() {
    Module.__initializeDependencies(this);
  }

  /**
   * Instantiate a Module. If this Module has some dependencies
   * overridden, those will be propagated to the new Module.
   *
   * This is especially useful when you want to create a new
   * instance of a Module conditionally, since that's not
   * possible with the `Inject()` decorator.
   */
  protected initDependency<M>(
    module: new () => M,
    ...overrides: Dependencies
  ): M {
    const dependenciesOverrides = this.__dependenciesOverrides?.() ?? new Map();

    for (const [dependency, override] of overrides) {
      dependenciesOverrides.set(dependency, override);
    }

    const override = dependenciesOverrides.get(module);
    if (override) {
      return initializeDependency(override, dependenciesOverrides);
    }

    // @ts-expect-error
    if (!module.__init_module || typeof module.__init_module !== "function")
      throw new Error(
        `'${module.name}' is not a Module. Only a Module can be a dependency, make sure the provided constructor extends the Module or uses the MixinModule.`
      );

    // @ts-expect-error
    return module.__init_module(dependenciesOverrides);
  }
}
