export const Button = {
  Primary: ({ children, icon, disabled, onClick, className = "", style = {} }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 20px",
        borderRadius: 10,
        border: "none",
        background: disabled ? "rgba(250,76,0,0.4)" : "#FA4C00",
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        transition: "background 0.15s",
        ...style,
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = "#e64500"; }}
      onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.background = "#FA4C00"; }}
      className={className}
    >
      {icon}
      {children}
    </button>
  ),

  Secondary: ({ children, icon, onClick, className = "", style = {} }) => (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 20px",
        borderRadius: 10,
        background: "var(--color-surface-2)",
        border: "1px solid var(--color-border)",
        color: "var(--color-text)",
        fontSize: 14,
        fontWeight: 500,
        cursor: "pointer",
        transition: "background 0.15s",
        ...style,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-surface-3)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-surface-2)"; }}
      className={className}
    >
      {icon}
      {children}
    </button>
  ),

  Outline: ({ children, onClick, className = "" }) => (
    <button
      onClick={onClick}
      style={{
        padding: "10px 20px",
        borderRadius: 10,
        background: "transparent",
        border: "1px solid rgba(250,76,0,0.4)",
        color: "#FA4C00",
        fontSize: 14,
        fontWeight: 500,
        cursor: "pointer",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(250,76,0,0.1)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
      className={className}
    >
      {children}
    </button>
  ),

  IconButton: ({ children, variant = "default", onClick, className = "" }) => {
    const styles = {
      default: { background: "var(--color-surface-2)", color: "var(--color-text)" },
      danger:  { background: "rgba(239,68,68,0.1)",    color: "#EF4444" },
      success: { background: "rgba(34,197,94,0.1)",    color: "#22C55E" },
    };

    return (
      <button
        onClick={onClick}
        style={{
          padding: 8,
          borderRadius: 8,
          border: "none",
          cursor: "pointer",
          transition: "background 0.15s",
          ...styles[variant],
        }}
        className={className}
      >
        {children}
      </button>
    );
  },
};
