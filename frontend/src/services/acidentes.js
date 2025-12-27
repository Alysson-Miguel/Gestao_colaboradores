// src/services/acidentes.js
import api from "./api";

export const AcidentesAPI = {
  async listar() {
    const res = await api.get("/acidentes");
    return res.data.data || [];
  },

  async criar(payload) {
    const res = await api.post("/acidentes", payload);
    return res.data.data;
  },

  async presignUpload({ opsId, files }) {
    const res = await api.post("/acidentes/presign-upload", {
      opsId,
      files,
    });
    return res.data.data; // Array de { uploadUrl, key }
  },

  // tenta pegar usuário logado (quem registrou)
  async me() {
    const res = await api.get("/auth/me");
    return res.data.data; // { name, email, ... }
  },
};