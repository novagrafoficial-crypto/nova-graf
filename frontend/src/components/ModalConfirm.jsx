// frontend/src/components/ModalConfirm.jsx
import { useEffect } from "react";

const COLORS = {
  teal2: "#35BA99",
  teal1: "#1A6163",
  red: "#FF0000",
  white: "#FFFFFF",
  border: "#D9D9D6",
  tealLight: "rgba(53, 186, 153, 0.12)",
  redSoft: "rgba(255, 0, 0, 0.08)",
};

export default function ModalConfirm({ 
  isOpen, 
  title = "Confirmar acción", 
  message, 
  onConfirm, 
  onCancel,
  confirmText = "Eliminar",
  cancelText = "Cancelar",
  type = "danger" // danger, warning, info
}) {
  useEffect(() => {
    if (isOpen) {
      // Prevenir scroll cuando el modal está abierto
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getColors = () => {
    switch (type) {
      case "danger":
        return {
          border: COLORS.red,
          bg: COLORS.redSoft,
          hover: COLORS.red,
          text: COLORS.red,
        };
      case "warning":
        return {
          border: "#f59e0b",
          bg: "rgba(245, 158, 11, 0.08)",
          hover: "#f59e0b",
          text: "#f59e0b",
        };
      default:
        return {
          border: COLORS.teal2,
          bg: COLORS.tealLight,
          hover: COLORS.teal1,
          text: COLORS.teal1,
        };
    }
  };

  const colors = getColors();

  return (
    <div className="modal-confirm-overlay" onClick={onCancel}>
      <div className="modal-confirm-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-confirm-header">
          <span className="modal-confirm-icon">
            {type === "danger" ? "⚠️" : type === "warning" ? "⚡" : "ℹ️"}
          </span>
          <h3 className="modal-confirm-title">{title}</h3>
        </div>
        
        <div className="modal-confirm-body">
          <p>{message}</p>
        </div>
        
        <div className="modal-confirm-footer">
          <button className="modal-confirm-btn modal-confirm-btn-cancel" onClick={onCancel}>
            {cancelText}
          </button>
          <button 
            className={`modal-confirm-btn modal-confirm-btn-${type}`} 
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>

      <style>{`
        .modal-confirm-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          animation: fadeIn 0.2s ease;
        }

        .modal-confirm-container {
          background: ${COLORS.white};
          border-radius: 20px;
          width: 90%;
          max-width: 400px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
          animation: slideIn 0.3s ease;
          overflow: hidden;
        }

        .modal-confirm-header {
          padding: 24px 24px 0 24px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .modal-confirm-icon {
          font-size: 28px;
        }

        .modal-confirm-title {
          font-size: 18px;
          font-weight: 700;
          color: ${COLORS.teal1};
          margin: 0;
          font-family: 'Syne', sans-serif;
        }

        .modal-confirm-body {
          padding: 16px 24px;
          color: #4A5568;
          font-size: 14px;
          line-height: 1.5;
        }

        .modal-confirm-footer {
          padding: 16px 24px 24px 24px;
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .modal-confirm-btn {
          padding: 10px 24px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .modal-confirm-btn-cancel {
          background: ${COLORS.tealLight};
          color: ${COLORS.teal1};
        }

        .modal-confirm-btn-cancel:hover {
          background: ${COLORS.teal2};
          color: ${COLORS.white};
          transform: translateY(-1px);
        }

        .modal-confirm-btn-danger {
          background: ${COLORS.redSoft};
          color: ${COLORS.red};
        }

        .modal-confirm-btn-danger:hover {
          background: ${COLORS.red};
          color: ${COLORS.white};
          transform: translateY(-1px);
        }

        .modal-confirm-btn-warning {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        }

        .modal-confirm-btn-warning:hover {
          background: #f59e0b;
          color: white;
        }

        .modal-confirm-btn-info {
          background: ${COLORS.tealLight};
          color: ${COLORS.teal1};
        }

        .modal-confirm-btn-info:hover {
          background: ${COLORS.teal1};
          color: ${COLORS.white};
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}