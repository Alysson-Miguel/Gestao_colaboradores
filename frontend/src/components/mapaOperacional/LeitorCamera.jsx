import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { CameraOff } from "lucide-react";

/**
 * Leitor de QR Code pela câmera (celular/tablet/notebook).
 * Quando a câmera não está disponível (sem permissão, HTTP fora do localhost, sem dispositivo),
 * avisa e a tela continua utilizável pela digitação do código.
 */
export function LeitorCamera({ ativo, onLeitura }) {
  const videoRef = useRef(null);
  const ultimaLeitura = useRef({ texto: "", em: 0 });
  const onLeituraRef = useRef(onLeitura);
  const [erroCamera, setErroCamera] = useState(null);
  // Sem getUserMedia (ex.: HTTP fora do localhost) a câmera nem é tentada.
  const semSuporte = typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia;
  const erro = semSuporte ? "A câmera só funciona em conexão segura (HTTPS). Digite o código abaixo." : erroCamera;

  useEffect(() => {
    onLeituraRef.current = onLeitura;
  });

  useEffect(() => {
    if (!ativo || semSuporte) return undefined;

    let parado = false;
    let stream = null;
    let quadro = null;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    const varrer = () => {
      const video = videoRef.current;
      if (parado || !video) return;
      if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth) {
        // reduz o quadro: leitura mais rápida e suficiente pra um QR grande
        const escala = Math.min(1, 640 / video.videoWidth);
        canvas.width = Math.round(video.videoWidth * escala);
        canvas.height = Math.round(video.videoHeight * escala);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imagem = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const codigo = jsQR(imagem.data, imagem.width, imagem.height, { inversionAttempts: "dontInvert" });
        if (codigo?.data) {
          const agora = Date.now();
          // evita disparar várias vezes o mesmo QR parado na frente da câmera
          if (codigo.data !== ultimaLeitura.current.texto || agora - ultimaLeitura.current.em > 3000) {
            ultimaLeitura.current = { texto: codigo.data, em: agora };
            onLeituraRef.current?.(codigo.data);
          }
        }
      }
      quadro = requestAnimationFrame(varrer);
    };

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })
      .then((s) => {
        if (parado) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        setErroCamera(null);
        const video = videoRef.current;
        video.srcObject = s;
        video.setAttribute("playsinline", "true");
        video.play().catch(() => {});
        quadro = requestAnimationFrame(varrer);
      })
      .catch((e) => {
        setErroCamera(
          e?.name === "NotAllowedError"
            ? "Permissão da câmera negada. Libere o acesso no navegador ou digite o código abaixo."
            : "Não foi possível abrir a câmera. Digite o código abaixo."
        );
      });

    return () => {
      parado = true;
      if (quadro) cancelAnimationFrame(quadro);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [ativo, semSuporte]);

  if (!ativo) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-default bg-black aspect-[4/3] max-h-[55vh] w-full">
      {erro ? (
        <div role="alert" className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-muted">
          <div className="space-y-2">
            <CameraOff size={28} className="mx-auto" aria-hidden="true" />
            <p>{erro}</p>
          </div>
        </div>
      ) : (
        <>
          <video ref={videoRef} muted playsInline className="h-full w-full object-cover" aria-label="Câmera para leitura do QR Code" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="h-2/3 aspect-square rounded-2xl border-2 border-[#FA4C00]/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
          </div>
        </>
      )}
    </div>
  );
}
