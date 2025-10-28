# totp-wasm

## Установка

Установка [wasm-pack](https://drager.github.io/wasm-pack/installer/).

Используется [totp-lite](https://crates.io/crates/totp-lite/2.0.1) вместо более популярного [totp-rs](https://crates.io/crates/totp-rs), т.к. totp-rs используется `std::time`, который не поддерживается `wasm-pack`.

## Использование

```bash
wasm-pack build --target web
```

```bash
wasm-pack test --headless --firefox
```

## 🔋 Batteries Included

* [`wasm-bindgen`](https://github.com/wasm-bindgen/wasm-bindgen) for communicating
  between WebAssembly and JavaScript.
* [`console_error_panic_hook`](https://github.com/rustwasm/console_error_panic_hook)
  for logging panic messages to the developer console.

## License

* MIT license ([LICENSE-MIT](LICENSE-MIT) or http://opensource.org/licenses/MIT)
