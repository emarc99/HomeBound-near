import { nearAiModel, verifyModelAttestationLive } from "@/lib/ai/nearai";
import { getRegisteredSigner } from "@/lib/near/views";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const model = nearAiModel();
    const onChainSigner = await getRegisteredSigner(model).catch(() => null);
    const report = await verifyModelAttestationLive(onChainSigner);
    return Response.json({ ok: true, report });
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : "Attestation check failed" },
      { status: 500 },
    );
  }
}
