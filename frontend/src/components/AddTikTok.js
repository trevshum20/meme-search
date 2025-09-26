import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFirebaseToken } from "../firebase";
import "./AddTikTok.css";

const AddTikTok = ({user}) => {
    const BACKEND_BASE_URL = process.env.REACT_APP_BACKEND_BASE_URL;
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, kind: "success", msg: "" });


    const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setIsLoading(true);
    setToast({ show: false, kind: "success", msg: "" });

    try {
        const token = await getFirebaseToken();
        const resp = await axios.post(
        `${BACKEND_BASE_URL}/api/ingest`,
        { url },
        { headers: { Authorization: `Bearer ${token}` } }
        );

        setResult(resp.data);
        setUrl("");
        setToast({
        show: true,
        kind: "success",
        msg: "Ingest request accepted. Processing in background.",
        });
    } catch (err) {
        console.error(err);
        const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to ingest TikTok URL.";
        setError(msg);
        setToast({ show: true, kind: "danger", msg });
    } finally {
        setIsLoading(false);
    }
    };

  return (
    <main className="container my-4 addtiktok-container">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">
          <h1 className="h3 mb-2">Add TikTok</h1>
          <p className="text-muted mb-4">Paste a TikTok URL and submit to ingest.</p>

          <form className="row g-2 align-items-center" onSubmit={onSubmit}>
            <div className="col-12 col-md">
              <input
                type="url"
                required
                className="form-control"
                placeholder="https://www.tiktok.com/@user/video/123..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <div className="col-12 col-md-auto">
              <button type="submit" className="btn btn-primary w-100" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                    Adding…
                  </>
                ) : (
                  "Add"
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="alert alert-danger mt-3" role="alert">
              <strong>⚠️</strong> {error}
            </div>
          )}

          {result && (
            <div className="card bg-dark text-light mt-3">
              <div className="card-body">
                <pre className="mb-0 overflow-auto addtiktok-pre">
{JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          )}

          <div className="mt-3 small text-muted">
            Signed in as: <strong>{user?.email ?? "unknown"}</strong>
          </div>
        </div>
      </div>

      {/* Toast (click to dismiss) */}
      {toast.show && (
        <div className="addtiktok-toast-wrapper" onClick={() => setToast({ ...toast, show: false })} title="Click to dismiss">
          <div className={`alert alert-${toast.kind} shadow addtiktok-toast`} role="alert">
            {toast.msg}
          </div>
        </div>
      )}
    </main>
  );
};

export default AddTikTok;
