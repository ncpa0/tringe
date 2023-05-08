# tringe

A TypeScript dependency injection library.

## Usage

```ts
import { Inject, Module } from "tringe";

class MyDependency {
  public sayHello() {
    console.log("Hello!");
  }
}

class MyService extends Module {
  @Inject(() => MyDependency)
  declare dependency!: MyDependency;

  public start() {
    this.dependency.sayHello();
  }
}

const service = new MyService();

// dependency gets automatically initialized with a `new MyDependency()`
console.assert(service.dependency != null); // true
console.assert(service.dependency instanceof MyDependency); // true

// Inject a different implementation of MyDependency
let helloCount = 0;
class MockDependency {
  public sayHello() {
    helloCount++;
  }
}

// `Module.di()` initializes the module similarly to `new Module`, but can also inject dependencies
const service = MyService.di([MyDependency, MockDependency]); ()
console.assert(service.dependency instanceof MockDependency); // true
```

If the class you want to inject a dependency into already extends another class, you can use a `MixinModule` decorator instead of extending the `Module` class.

```ts
import { Inject, MixinModule } from "tringe";

class MyDependency {
  public sayHello() {
    console.log("Hello!");
  }
}

@MixinModule
class MyService {
  @Inject(() => MyDependency)
  declare dependency!: MyDependency;

  public start() {
    this.dependency.sayHello();
  }
}
```
