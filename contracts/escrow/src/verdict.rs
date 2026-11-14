use near_sdk::near;
use near_sdk::serde_json::{self, Value};

#[near(serializers = [borsh, json])]
#[serde(rename_all = "snake_case")]
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Verdict {
    Pass,
    Fail,
    NeedsReview,
}

#[derive(Debug, PartialEq, Eq)]
pub struct ParsedVerdict {
    pub verdict: Verdict,
    pub confidence: u8,
    pub reference: String,
}

/// The exact text NEAR AI Cloud signs for a `provider_tee` signature.
pub fn signed_text(model_id: &str, request_hash: &str, response_hash: &str) -> String {
    format!("{model_id}:{request_hash}:{response_hash}")
}

/// The reference the model must echo back, binding its answer to one stage and one photo.
pub fn expected_reference(project_id: &str, stage: u32, evidence_sha256: &str) -> String {
    format!("{project_id}/{stage}/{evidence_sha256}")
}

/// Criteria-bound reference pinning project, stage, SHA-256 acceptance criteria hash, and photo hash.
pub fn expected_reference_with_criteria(
    project_id: &str,
    stage: u32,
    criteria_hash: &str,
    evidence_sha256: &str,
) -> String {
    format!("{project_id}/{stage}/{criteria_hash}/{evidence_sha256}")
}

/// Reads the verdict out of an OpenAI-style chat completion body.
pub fn parse_response(body: &str) -> Result<ParsedVerdict, &'static str> {
    let response: Value = serde_json::from_str(body).map_err(|_| "Response body is not JSON")?;
    let content = response["choices"][0]["message"]["content"]
        .as_str()
        .ok_or("Response has no message content")?;
    let answer: Value =
        serde_json::from_str(strip_fences(content)).map_err(|_| "Model answer is not JSON")?;

    let verdict = match answer["verdict"].as_str() {
        Some("pass") => Verdict::Pass,
        Some("fail") => Verdict::Fail,
        Some("needs_review") => Verdict::NeedsReview,
        _ => return Err("Model answer has no valid verdict"),
    };
    let confidence = match answer["confidence"].as_f64() {
        Some(c) if (0.0..=100.0).contains(&c) => c.round() as u8,
        _ => return Err("Model answer has no valid confidence"),
    };
    let reference = answer["ref"]
        .as_str()
        .ok_or("Model answer has no ref")?
        .to_string();

    Ok(ParsedVerdict {
        verdict,
        confidence,
        reference,
    })
}

fn strip_fences(content: &str) -> &str {
    let trimmed = content.trim();
    let Some(inner) = trimmed.strip_prefix("```") else {
        return trimmed;
    };
    let inner = inner.strip_prefix("json").unwrap_or(inner);
    inner.strip_suffix("```").unwrap_or(inner).trim()
}

pub fn to_hex(bytes: &[u8]) -> String {
    const DIGITS: &[u8; 16] = b"0123456789abcdef";
    let mut out = String::with_capacity(bytes.len() * 2);
    for b in bytes {
        out.push(DIGITS[(b >> 4) as usize] as char);
        out.push(DIGITS[(b & 0x0f) as usize] as char);
    }
    out
}

pub fn from_hex<const N: usize>(text: &str) -> Option<[u8; N]> {
    let text = text.strip_prefix("0x").unwrap_or(text);
    if text.len() != N * 2 {
        return None;
    }
    let mut out = [0u8; N];
    for (i, pair) in text.as_bytes().chunks(2).enumerate() {
        let hi = (pair[0] as char).to_digit(16)?;
        let lo = (pair[1] as char).to_digit(16)?;
        out[i] = (hi * 16 + lo) as u8;
    }
    Some(out)
}

/// A lowercase 64-character SHA-256 hex digest.
pub fn is_sha256_hex(text: &str) -> bool {
    text.len() == 64 && text.bytes().all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn body(content: &str) -> String {
        serde_json::json!({ "choices": [{ "message": { "content": content } }] }).to_string()
    }

    #[test]
    fn parses_plain_and_fenced_answers() {
        let plain = body(r#"{"verdict":"pass","confidence":82,"ref":"p/0/ab"}"#);
        let fenced = body("```json\n{\"verdict\":\"fail\",\"confidence\":40.4,\"ref\":\"x\"}\n```");
        assert_eq!(
            parse_response(&plain).unwrap(),
            ParsedVerdict { verdict: Verdict::Pass, confidence: 82, reference: "p/0/ab".into() }
        );
        assert_eq!(parse_response(&fenced).unwrap().confidence, 40);
    }

    #[test]
    fn rejects_unknown_verdicts_and_bad_confidence() {
        assert!(parse_response(&body(r#"{"verdict":"PASS","confidence":90,"ref":"x"}"#)).is_err());
        assert!(parse_response(&body(r#"{"verdict":"pass","confidence":150,"ref":"x"}"#)).is_err());
        assert!(parse_response(&body(r#"{"verdict":"pass","confidence":90}"#)).is_err());
    }

    #[test]
    fn hex_round_trips() {
        let bytes = [0u8, 1, 0xab, 0xff];
        assert_eq!(to_hex(&bytes), "0001abff");
        assert_eq!(from_hex::<4>("0x0001ABff"), Some(bytes));
        assert_eq!(from_hex::<4>("0001ab"), None);
        assert_eq!(from_hex::<4>("zz01abff"), None);
    }
}
