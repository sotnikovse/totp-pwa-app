# totp-wasm

## Установка

- [`rust`](https://rust-lang.org/tools/install/)
- [`wasm-pack`](https://drager.github.io/wasm-pack/installer/)

## Инструменты

- [`wasm-bindgen`](https://github.com/wasm-bindgen/wasm-bindgen)

## Использование

Сборка

```bash
wasm-pack build --target web
```

Тесты

```bash
wasm-pack test --headless --firefox
```

```bash
cargo test
```

MIT license ([LICENSE-MIT](LICENSE-MIT))
