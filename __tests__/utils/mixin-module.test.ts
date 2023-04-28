import { describe } from "@jest/globals";
import { Inject, MixinModule } from "@src";

class Dep1 {
  isDep = true;
}

class Dep2 {
  isDep = true;
}

describe("MixinModule", () => {
  it("should add the Module into the prototype chain", () => {
    class Foo {
      static staticFooFn() {
        return "foo";
      }

      isFoo = true;

      fooFn() {
        return "foo";
      }
    }

    @MixinModule
    class Bar extends Foo {
      isBar = true;

      declare initDependency: () => void;

      declare static di: () => void;
    }

    const bar = new Bar();

    expect(bar).toBeInstanceOf(Foo);
    expect(bar).toBeInstanceOf(Bar);
    expect(bar.isFoo).toBe(true);
    expect(bar.isBar).toBe(true);
    expect(bar.fooFn()).toBe("foo");
    expect(Bar.staticFooFn()).toBe("foo");
    expect(bar.initDependency).toBeDefined();
    expect(Bar.di).toBeDefined();
  });

  it("should inject dependencies", () => {
    class Foo {
      @Inject(() => Dep1)
      dep1!: Dep1;
    }

    @MixinModule
    class Bar extends Foo {
      @Inject(() => Dep2)
      dep2!: Dep2;
    }

    const bar = new Bar();

    expect(bar.dep1.isDep).toBe(true);
    expect(bar.dep2.isDep).toBe(true);
  });
});
