use base32::{decode, Alphabet};
use hmac::digest::KeyInit;
use hmac::{Hmac, Mac};
use sha1::Sha1;
use sha2::{Sha256, Sha512};
use wasm_bindgen::prelude::*;

type HmacSha1 = Hmac<Sha1>;
type HmacSha256 = Hmac<Sha256>;
type HmacSha512 = Hmac<Sha512>;

#[repr(u8)]
enum HashAlgorithm {
	Sha1 = 0,
	Sha256 = 1,
	Sha512 = 2,
}

#[wasm_bindgen]
pub enum TotpHashAlgorithm {
	Sha1 = "SHA1",
	Sha256 = "SHA256",
	Sha512 = "SHA512",
}

#[wasm_bindgen]
extern "C" {
	#[wasm_bindgen(js_namespace = Date)]
	fn now() -> f64;
}

// Генерация HOTP [RFC4226]
fn hotp(key: &[u8], counter: u64, digits: u32, algorithm: HashAlgorithm) -> Result<String, String> {
	match algorithm {
		HashAlgorithm::Sha1 => generate_hmac::<HmacSha1>(&key, counter, digits),
		HashAlgorithm::Sha256 => generate_hmac::<HmacSha256>(&key, counter, digits),
		HashAlgorithm::Sha512 => generate_hmac::<HmacSha512>(&key, counter, digits),
	}
}

fn generate_hmac<M: Mac + KeyInit>(key: &[u8], counter: u64, digits: u32) -> Result<String, String> {
	let mut mac = <M as Mac>::new_from_slice(key).expect("HMAC can take key of any size");
	let counter_bytes = counter.to_be_bytes();
	mac.update(&counter_bytes);
	let result = mac.finalize().into_bytes();
	let code = dynamic_truncation(&result, digits)?;
	Ok(code)
}

// Динамическое преобразование HMAC в короткое число [RFC4226]
fn dynamic_truncation(hs: &[u8], digits: u32) -> Result<String, String> {
	let hs_len = hs.len();
	let min_len = match hs_len {
		20 => 20, // SHA1
		32 => 32, // SHA256
		64 => 64, // SHA512
		_ => return Err(format!("Invalid HMAC length: {}", hs_len)),
	};
	if hs_len < min_len {
		return Err(format!("HMAC result too short: {}", hs_len));
	}

	let offset = (hs[hs_len - 1] & 0x0F) as usize;
	if offset + 4 > hs_len {
		return Err(String::from("Invalid offset for dynamic truncation"));
	}
	let bytes = &hs[offset..offset + 4];
	let code = u32::from_be_bytes([bytes[0], bytes[1], bytes[2], bytes[3]]) & 0x7FFFFFFF;
	let modulus = 10u32.pow(digits);
	let result = format!("{:0width$}", code % modulus, width = digits as usize);
	Ok(result)
}

// Генерация TOTP [RFC6238]
#[wasm_bindgen]
pub fn totp(secret: &str, step: u64, digits: u32, algorithm: TotpHashAlgorithm) -> Result<String, JsError> {
	let timestamp = (now() / 1000.0) as u64;
	let counter = timestamp / step;
	let key =
		decode(Alphabet::Rfc4648 { padding: false }, secret).ok_or_else(|| JsError::new("Invalid base32 secret"))?;

	match algorithm {
		TotpHashAlgorithm::Sha1 => {
			hotp(&key, counter, digits, HashAlgorithm::Sha1).map_err(|e| JsError::new(&e.to_string()))
		}
		TotpHashAlgorithm::Sha256 => {
			hotp(&key, counter, digits, HashAlgorithm::Sha256).map_err(|e| JsError::new(&e.to_string()))
		}
		TotpHashAlgorithm::Sha512 => {
			hotp(&key, counter, digits, HashAlgorithm::Sha512).map_err(|e| JsError::new(&e.to_string()))
		}
		_ => Err(JsError::new("Invalid algorithm")),
	}
}

#[cfg(test)]
mod tests {
	use super::*;

	#[test]
	fn test_hotp_sha1() {
		let key = vec![72, 101, 108, 108, 111, 33, 222, 173, 190, 239]; // "JBSWY3DPEHPK3PXP"

		let code6 = hotp(&key, 1, 6, HashAlgorithm::Sha1).unwrap();
		assert_eq!(code6.len(), 6);
		assert!(code6.chars().all(|c| c.is_ascii_digit()));
		assert_eq!(code6, "996554");

		let code8 = hotp(&key, 1, 8, HashAlgorithm::Sha1).unwrap();
		assert_eq!(code8.len(), 8);
		assert!(code8.chars().all(|c| c.is_ascii_digit()));
		assert_eq!(code8, "41996554");
	}

	#[test]
	fn test_hotp_sha256() {
		let key = vec![72, 101, 108, 108, 111, 33, 222, 173, 190, 239]; // "JBSWY3DPEHPK3PXP"

		let code6 = hotp(&key, 1, 6, HashAlgorithm::Sha256).unwrap();
		assert_eq!(code6.len(), 6);
		assert!(code6.chars().all(|c| c.is_ascii_digit()));
		assert_eq!(code6, "344551");

		let code8 = hotp(&key, 1, 8, HashAlgorithm::Sha256).unwrap();
		assert_eq!(code8.len(), 8);
		assert!(code8.chars().all(|c| c.is_ascii_digit()));
		assert_eq!(code8, "36344551");
	}

	#[test]
	fn test_hotp_sha512() {
		let key = vec![72, 101, 108, 108, 111, 33, 222, 173, 190, 239]; // "JBSWY3DPEHPK3PXP"

		let code6 = hotp(&key, 1, 6, HashAlgorithm::Sha512).unwrap();
		assert_eq!(code6.len(), 6);
		assert!(code6.chars().all(|c| c.is_ascii_digit()));
		assert_eq!(code6, "439887");

		let code8 = hotp(&key, 1, 8, HashAlgorithm::Sha512).unwrap();
		assert_eq!(code8.len(), 8);
		assert!(code8.chars().all(|c| c.is_ascii_digit()));
		assert_eq!(code8, "31439887");
	}

	#[test]
	fn test_hotp_different_algorithms() {
		let key = vec![72, 101, 108, 108, 111, 33, 222, 173, 190, 239]; // "JBSWY3DPEHPK3PXP"

		let code_sha1 = hotp(&key, 1, 6, HashAlgorithm::Sha1).unwrap();
		let code_sha256 = hotp(&key, 1, 6, HashAlgorithm::Sha256).unwrap();
		let code_sha512 = hotp(&key, 1, 6, HashAlgorithm::Sha512).unwrap();

		assert_ne!(code_sha1, code_sha256);
		assert_ne!(code_sha1, code_sha512);
		assert_ne!(code_sha256, code_sha512);
	}

	#[test]
	fn test_dynamic_truncation() {
		let hs: &[u8] = b"12345678901234567890";

		let code6 = dynamic_truncation(&hs, 6).unwrap();
		assert_eq!(code6.len(), 6);
		assert!(code6.chars().all(|c| c.is_ascii_digit()));

		let code8 = dynamic_truncation(&hs, 8).unwrap();
		assert_eq!(code8.len(), 8);
		assert!(code8.chars().all(|c| c.is_ascii_digit()));
	}

	#[test]
	fn test_dynamic_truncation_failure() {
		let hs19: &[u8] = b"1234567890123456789";
		assert!(dynamic_truncation(&hs19, 6).is_err(),);
		let hs21: &[u8] = b"123456789012345678901";
		assert!(dynamic_truncation(&hs21, 6).is_err(),);

		let hs31: &[u8] = b"1234567890123456789012345678901";
		assert!(dynamic_truncation(&hs31, 6).is_err(),);
		let hs33: &[u8] = b"123456789012345678901234567890123";
		assert!(dynamic_truncation(&hs33, 6).is_err(),);

		let hs63: &[u8] = b"123456789012345678901234567890123456789012345678901234567890123";
		assert!(dynamic_truncation(&hs63, 6).is_err(),);
		let hs65: &[u8] = b"12345678901234567890123456789012345678901234567890123456789012345";
		assert!(dynamic_truncation(&hs65, 6).is_err(),);
	}
}

#[cfg(test)]
mod wasm_tests {
	use super::*;
	use wasm_bindgen_test::*;

	wasm_bindgen_test_configure!(run_in_browser);

	#[wasm_bindgen_test]
	fn test_totp_sha1() {
		let secret = "JBSWY3DPEHPK3PXP".to_string();

		let code6 = totp(&secret, 30, 6, TotpHashAlgorithm::Sha1).unwrap();
		assert_eq!(code6.len(), 6);
		assert!(code6.chars().all(|c| c.is_ascii_digit()));

		let code8 = totp(&secret, 30, 8, TotpHashAlgorithm::Sha1).unwrap();
		assert_eq!(code8.len(), 8);
		assert!(code8.chars().all(|c| c.is_ascii_digit()));
	}

	#[wasm_bindgen_test]
	fn test_totp_sha256() {
		let secret = "JBSWY3DPEHPK3PXP".to_string();

		let code6 = totp(&secret, 30, 6, TotpHashAlgorithm::Sha256).unwrap();
		assert_eq!(code6.len(), 6);
		assert!(code6.chars().all(|c| c.is_ascii_digit()));

		let code8 = totp(&secret, 30, 8, TotpHashAlgorithm::Sha256).unwrap();
		assert_eq!(code8.len(), 8);
		assert!(code8.chars().all(|c| c.is_ascii_digit()));
	}

	#[wasm_bindgen_test]
	fn test_totp_sha512() {
		let secret = "JBSWY3DPEHPK3PXP".to_string();

		let code6 = totp(&secret, 30, 6, TotpHashAlgorithm::Sha512).unwrap();
		assert_eq!(code6.len(), 6);
		assert!(code6.chars().all(|c| c.is_ascii_digit()));

		let code8 = totp(&secret, 30, 8, TotpHashAlgorithm::Sha512).unwrap();
		assert_eq!(code8.len(), 8);
		assert!(code8.chars().all(|c| c.is_ascii_digit()));
	}

	#[wasm_bindgen_test]
	fn test_totp_failure() {
		assert!(totp("secret", 30, 6, TotpHashAlgorithm::Sha1).is_err());
	}
}
