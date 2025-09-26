import axios from "axios";
import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { getFirebaseToken } from "../firebase";
import { useNavigate } from "react-router-dom";

import "./AddTikTok.css";

const AddTikTok = ({user}) => {
    const BACKEND_BASE_URL = process.env.REACT_APP_BACKEND_BASE_URL;
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, kind: "success", msg: "" });
  const location = useLocation();
  const autoSubmittedRef = useRef(false);
  const [showContextForm, setShowContextForm] = useState(false);
  const [context, setContext] = useState({ popCulture: "", characters: "", notes: "" });
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const prefill = params.get("url");
    const auto = params.get("auto") === "1";
    if (prefill && !url) {
      setUrl(prefill);
      if (auto && !autoSubmittedRef.current) {
        autoSubmittedRef.current = true;
        setTimeout(() => onSubmit({ urlOverride: prefill }), 0);
      }
    }
  }, [location.search]);


    const onSubmit = async (eOrOptions) => {
    if (eOrOptions?.preventDefault) eOrOptions.preventDefault();
    const urlToSend = eOrOptions?.urlOverride || url;
    setError("");
    setResult(null);
    setIsLoading(true);
    setToast({ show: false, kind: "success", msg: "" });

    try {
        const token = await getFirebaseToken();
        const resp = await axios.post(
        `${BACKEND_BASE_URL}/api/ingest`,
        {
          url: urlToSend,
          userEmail: user?.email,
          context,
        },
        { headers: { Authorization: `Bearer ${token}` } }
        );

        setResult(resp.data);
        setUrl("");
        setContext({ popCulture: "", characters: "", notes: "" });
        setShowContextForm(false);
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

  const handleContextChange = (e) => {
    const { name, value } = e.target;
    setContext((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <main className="container my-4 addtiktok-container">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-12">
          <h1 className="h3 mb-2">Add TikTok</h1>
          <p className="text-muted mb-4">Paste a TikTok URL and submit to ingest.</p>

          {/* URL + Submit + Add Context (button sits to the right of Submit) */}
          <form className="row g-1 align-items-center" onSubmit={onSubmit}>
            <div className="col-12 col-sm">
              <input
                type="url"
                required
                className="form-control"
                placeholder="https://www.tiktok.com/@user/video/123..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>

            <div className="col-12 col-sm-auto">
              <button type="submit" className="btn btn-primary addtiktok-submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                    Submitting…
                  </>
                ) : (
                  "Submit"
                )}
              </button>
            </div>

            <div className="col-12 col-sm-auto">
              <button
                type="button"
                className="btn btn-outline-secondary addtiktok-toggle"
                onClick={() => setShowContextForm((s) => !s)}
                disabled={isLoading}
              >
                {showContextForm ? "Hide Context" : "+ Add Context"}
              </button>
            </div>
          </form>

          <div className="mt-3">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate("/tiktok-search")}
            >
              {result ? "Done" : "Cancel"}
            </button>
          </div>

          {/* Stacked, wide context inputs */}
          {showContextForm && (
            <div className="addtiktok-context mt-3">
              <input
                type="text"
                className="form-control mb-2"
                name="popCulture"
                placeholder="Pop Culture References"
                maxLength={100}
                value={context.popCulture}
                onChange={handleContextChange}
              />
              <input
                type="text"
                className="form-control mb-2"
                name="characters"
                placeholder="Characters"
                maxLength={100}
                value={context.characters}
                onChange={handleContextChange}
              />
              <input
                type="text"
                className="form-control"
                name="notes"
                placeholder="Other Notes"
                maxLength={200}
                value={context.notes}
                onChange={handleContextChange}
              />
            </div>
          )}

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
