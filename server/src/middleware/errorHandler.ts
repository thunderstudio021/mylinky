import { Request, Response, NextFunction } from "express";

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error("[error]", err.message, err.stack);
  res.status(500).json({ error: "Erro interno do servidor" });
}
