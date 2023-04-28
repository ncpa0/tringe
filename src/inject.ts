import { MetaKey } from "./metadata";

export interface Constructor {
  new (): any;
}

/**
 * Mark a class property as a dependency. When the class is
 * instantiated, the dependency will be injected.
 *
 * If a default dependency is set via
 * `Module.setDefaultDependency`, value provided to that method
 * will be the one injected by default.
 *
 * If a Module is initiated using the `di()` method, the
 * dependencies provided to it will override the defaults.
 */
export const Inject = (dependency: () => Constructor) => {
  return (proto: object, key: string) => {
    const keys: string[] = Reflect.getMetadata(MetaKey.Keys, proto) ?? [];

    Reflect.defineMetadata(MetaKey.Keys, [...keys, key], proto);
    Reflect.defineMetadata(MetaKey.Inject, dependency, proto, key);
  };
};
