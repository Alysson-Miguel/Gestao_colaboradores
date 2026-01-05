import { authorizeRoles } from "./authorizeRoles.js";

export const onlyAdmin = authorizeRoles("ADMIN");

export const adminOrGestao = authorizeRoles("ADMIN", "GESTAO");

export const adminGestaoLideranca = authorizeRoles(
  "ADMIN",
  "GESTAO",
  "LIDERANCA"
);

export const allRoles = authorizeRoles(
  "ADMIN",
  "GESTAO",
  "LIDERANCA",
  "OPERACAO"
);
