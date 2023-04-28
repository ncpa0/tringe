import { afterEach, describe, expect, it } from "@jest/globals";
import { Inject, MixinModule, Module, setDefaultDependency } from "@src";
import { clearDefaultDependencies } from "@src/module";

class Foo {
  foo() {
    return "foo";
  }
}

class Bar {
  bar() {
    return "bar";
  }
}

class Baz {
  baz() {
    return "baz";
  }
}

describe("Module", () => {
  afterEach(() => {
    clearDefaultDependencies();
  });

  it("should inject dependencies defined in decorators", () => {
    class TestService extends Module {
      @Inject(() => Foo)
      declare foo: Foo;

      @Inject(() => Bar)
      declare bar: Bar;

      runDeps() {
        return this.foo.foo() + "," + this.bar.bar();
      }
    }

    const test = new TestService();

    expect(test.runDeps()).toBe("foo,bar");
  });

  it("should override the default dependencies when provided to init()", () => {
    class TestService extends Module {
      @Inject(() => Foo)
      declare foo: Foo;

      @Inject(() => Bar)
      declare bar: Bar;

      runDeps() {
        return this.foo.foo() + "," + this.bar.bar();
      }
    }

    class BarReplacement {
      bar() {
        return "bar-replacement";
      }
    }

    const test = TestService.di([Bar, BarReplacement]);

    expect(test.runDeps()).toBe("foo,bar-replacement");
    expect(Object.getPrototypeOf(test).constructor.name).toEqual("TestService");
  });

  it("should provide default dependencies", () => {
    class TestService extends Module {
      @Inject(() => Foo)
      declare foo: Foo;

      @Inject(() => Bar)
      declare bar: Bar;

      @Inject(() => Baz)
      declare baz: Baz;

      runDeps() {
        return this.foo.foo() + "," + this.bar.bar() + "," + this.baz.baz();
      }
    }

    setDefaultDependency(Bar, {
      bar() {
        return "bar-replacement";
      },
    });

    setDefaultDependency(
      Baz,
      class {
        baz() {
          return "baz-replacement";
        }
      }
    );

    const test = new TestService();

    expect(test.runDeps()).toBe("foo,bar-replacement,baz-replacement");
  });

  it("should propagate dependencies to nested services", () => {
    class TestService extends Module {
      @Inject(() => Foo)
      declare foo: Foo;

      @Inject(() => Bar)
      declare bar: Bar;

      runDeps() {
        return this.foo.foo() + "," + this.bar.bar();
      }
    }

    class TestService2 extends Module {
      @Inject(() => TestService)
      declare testService: TestService;

      runDeps() {
        return this.testService.runDeps();
      }
    }

    class TestService3 extends Module {
      @Inject(() => TestService2)
      declare testService2: TestService2;

      runDeps() {
        return this.testService2.runDeps();
      }
    }

    const test = TestService3.di([Bar, { bar: () => "not-a-bar" }]);

    expect(test.runDeps()).toBe("foo,not-a-bar");
  });

  it("overriding dependency should affect the result of spawnService()", () => {
    class TestService extends Module {
      @Inject(() => Foo)
      declare foo: Foo;

      runDeps() {
        return this.foo.foo();
      }
    }

    class TestService2 extends Module {
      runDeps() {
        const nestedService = this.initDependency(TestService);
        return nestedService.runDeps();
      }
    }

    class TestServiceReplacement {
      runDeps() {
        return "TestServiceReplacement";
      }
    }

    const test = TestService2.di([TestService, TestServiceReplacement]);

    expect(test.runDeps()).toBe("TestServiceReplacement");
  });

  it("dependencies should get injected even if the service class was extended", () => {
    class TestService extends Module {
      @Inject(() => Foo)
      declare foo: Foo;

      @Inject(() => Bar)
      declare bar: Bar;
    }

    const fooRepl = class {
      foo = () => "foo-replacement";
    };
    class TestService2 extends TestService {
      @Inject(() => fooRepl)
      declare foo: Foo;

      @Inject(() => Baz)
      declare baz: Baz;
    }
    class TestService3 extends TestService2 {}

    const test = TestService3.di();

    expect(test.foo).toBeInstanceOf(fooRepl);
    expect(test.bar).toBeInstanceOf(Bar);
    expect(test.baz).toBeInstanceOf(Baz);

    const test2 = TestService3.di([fooRepl, { foo: () => "FFOOO" }]);

    expect(test2.foo.foo()).toBe("FFOOO");
  });

  describe("initDependency()", () => {
    it("should propagate dependencies to nested services", () => {
      class TestService extends Module {
        @Inject(() => Foo)
        declare foo: Foo;

        @Inject(() => Bar)
        declare bar: Bar;

        runDeps() {
          return this.foo.foo() + "," + this.bar.bar();
        }
      }

      class TestService2 extends Module {
        runDeps() {
          const nestedService = this.initDependency(TestService);
          return nestedService.runDeps();
        }
      }

      class TestService3 extends Module {
        runDeps() {
          const nestedService = this.initDependency(TestService2);
          return nestedService.runDeps();
        }
      }

      const test = TestService3.di([Bar, { bar: () => "qux" }]);

      expect(test.runDeps()).toBe("foo,qux");
    });

    it("should properly override given dependencies", () => {
      class TestService extends Module {
        @Inject(() => Bar)
        declare bar: Bar;

        runDeps() {
          return this.bar.bar();
        }
      }

      class TestService2 extends Module {
        @Inject(() => Foo)
        declare foo: Foo;

        runDeps() {
          const nestedService = this.initDependency(TestService);
          return this.foo.foo() + "," + nestedService.runDeps();
        }
      }

      class TestService3 extends Module {
        runDeps() {
          const nestedService = this.initDependency(
            TestService2,
            [Foo, { foo: () => "1234" }],
            [Bar, { bar: () => "abcd" }]
          );
          return nestedService.runDeps();
        }
      }

      const test = TestService3.di([Bar, { bar: () => "qux" }]);

      expect(test.runDeps()).toBe("1234,abcd");
    });

    it("should correctly replace the dependency given to initDependency()", () => {
      class TestService extends Module {
        @Inject(() => Foo)
        private declare module: Foo;

        run() {
          return this.module.foo();
        }
      }

      class TestService2 extends Module {
        @Inject(() => Bar)
        private declare module: Bar;

        run() {
          return this.module.bar();
        }
      }

      class TestService3 extends Module {
        subService = this.initDependency(TestService);

        run() {
          return this.subService.run();
        }
      }

      const t = new TestService3();
      expect(t.run()).toBe("foo");
      expect(t.subService).toBeInstanceOf(TestService);

      const t2 = TestService3.di([TestService, TestService2]);
      expect(t2.run()).toBe("bar");
      expect(t2.subService).toBeInstanceOf(TestService2);
    });

    it("should correctly initialize mixin modules", () => {
      @MixinModule
      class MixinTest {
        @Inject(() => Foo)
        declare foo: Foo;

        run() {
          return this.foo.foo();
        }
      }

      class TestService extends Module {
        subService = this.initDependency(MixinTest);

        run() {
          return this.subService.run();
        }
      }

      const t = new TestService();

      expect(t.run()).toBe("foo");
      expect(t.subService).toBeInstanceOf(MixinTest);
    });
  });
});
