import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/links/resolve", async (req, res): Promise<void> => {
  const url = req.query.url as string;

  if (!url) {
    res.status(400).json({ error: "Missing url query parameter" });
    return;
  }

  try {
    const response = await fetch(url, { redirect: "manual" });
    const location = response.headers.get("location");

    if (!location) {
      if (response.ok || response.status === 200) {
        res.json({ resolvedUrl: url });
      } else {
        res.status(502).json({ error: "Could not resolve video URL", status: response.status });
      }
      return;
    }

    res.json({ resolvedUrl: location });
  } catch (err: any) {
    res.status(502).json({ error: "Failed to resolve link", detail: err?.message });
  }
});

export default router;
