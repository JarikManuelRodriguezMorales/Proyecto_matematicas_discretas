"""
Prueba de humo (smoke test) independiente para CustomTkinter.
Abre una ventana mínima y la cierra automáticamente tras 800 ms usando .after().
No forma parte del simulador web PayGraph.
"""
import sys
import tkinter as tk
import customtkinter as ctk


def ejecutar_smoke_test() -> None:
    ctk.set_appearance_mode("System")
    ctk.set_default_color_theme("blue")

    try:
        ventana = ctk.CTk()
    except tk.TclError as exc:
        print(f"[SMOKE TEST] Entorno sin servidor gráfico disponible: {exc}")
        sys.exit(0)

    ventana.title("CustomTkinter — Smoke Test")
    ventana.geometry("320x160")

    etiqueta = ctk.CTkLabel(
        ventana,
        text=f"CustomTkinter v{ctk.__version__} operativo",
        font=ctk.CTkFont(size=14, weight="bold"),
    )
    etiqueta.pack(padx=20, pady=40)

    # Cierra la ventana automáticamente después de 800 ms
    ventana.after(800, ventana.destroy)
    ventana.mainloop()
    print(f"[SMOKE TEST OK] Ventana creada y cerrada automáticamente (CustomTkinter v{ctk.__version__}).")


if __name__ == "__main__":
    ejecutar_smoke_test()
