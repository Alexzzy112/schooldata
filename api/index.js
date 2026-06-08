export default function handler(req, res) {
  res.status(200).json({ status: 'ok', url: req.url, method: req.method });
}
