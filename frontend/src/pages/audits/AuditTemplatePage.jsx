import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import { useLocation, useNavigate } from "react-router-dom";
import { Calendar, Clock, Package, User, ArrowLeft } from "lucide-react";
import { apiService, endpoints } from "../../utils/api";
import toast from "react-hot-toast";

const AuditTemplatePage = () => {

  const { state } = useLocation();
  const navigate = useNavigate();

  const [fields, setFields] = useState([]);
  const [answers, setAnswers] = useState({});
  const [activeSlot, setActiveSlot] = useState(null);
  const [templateId, setTemplateId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  /* ===============================
     CHECK STATE
  =============================== */

  useEffect(() => {
    if (!state) {
      toast.error("Invalid audit session");
      navigate("/audits/new");
    }
  }, []);

  /* ===============================
     GET SLOT FROM PREVIOUS PAGE
  =============================== */

  useEffect(() => {

    if (!state?.slots) return;

    const openSlot = state.slots.find(s => s.runtime_status === "OPEN");
    const graceSlot = state.slots.find(s => s.runtime_status === "GRACE");

    setActiveSlot(openSlot || graceSlot || null);

  }, [state]);

  /* ===============================
     LOAD TEMPLATE
  =============================== */

  useEffect(() => {

    const loadTemplate = async () => {

      try {

        setLoading(true);

        const res = await apiService.get(
          endpoints.templates.list,
          {
            params: {
              entity_type: state.entityType,
              entity_id: state.entityId
            }
          }
        );

        const templates = res?.data?.data?.templates || [];

        if (!templates.length) {
          toast.error("No template found");
          return;
        }

        const template = templates[0];

        setTemplateId(template.id);

        const schema =
          typeof template.schema_json === "string"
            ? JSON.parse(template.schema_json)
            : template.schema_json;

        setFields(schema?.fields || []);

      }
      catch (e) {

        console.error(e);
        toast.error("Failed to load template");

      }
      finally {
        setLoading(false);
      }

    };

    if (state?.entityType && state?.entityId) {
      loadTemplate();
    }

  }, [state?.entityType, state?.entityId]);

  /* ===============================
     ANSWER CHANGE
  =============================== */

  const handleChange = (id, value) => {

    setAnswers(prev => ({
      ...prev,
      [id]: value
    }));

  };

  /* ===============================
     SUBMIT AUDIT
  =============================== */

  const handleSubmit = async () => {

  if (!activeSlot) {
    toast.error("No active slot available");
    return;
  }

  if (!templateId) {
    toast.error("Template not loaded yet");
    return;
  }

  try {

    setSubmitting(true);

    const formData = new FormData();

    formData.append("entity_type", state.entityType);
    formData.append("entity_id", state.entityId);
    formData.append("entity_name", state.entityName);
    formData.append("template_id", templateId);
    formData.append("template_name", state.reportType);
    formData.append("slot_id", activeSlot.id);
    formData.append("auditor_name", state.auditor);
    formData.append("audit_date", state.date);
    formData.append("audit_time", state.time);

    /* ============================
       HANDLE ANSWERS + IMAGES
    ============================ */

    const answersData = {};

    Object.keys(answers).forEach(key => {

      const value = answers[key];

      if (value instanceof File) {

        formData.append(`image_${key}`, value);

      } else {

        answersData[key] = value;

      }

    });

    formData.append("answers", JSON.stringify(answersData));

    await apiService.post(
      endpoints.audit.save,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      }
    );

    toast.success("Audit submitted successfully");

    navigate("/audit-list");

  }
  catch (e) {

    console.error(e);
    toast.error("Audit submission failed");

  }
  finally {
    setSubmitting(false);
  }

};

  return (
    <Layout>

      <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-950">

        {/* HEADER */}

        <div className="max-w-6xl mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 mb-6">

          <div className="flex items-center justify-between mb-4">

            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Audit Details
            </h2>

            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg border dark:text-white border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Back
              <ArrowLeft size={16}/>
            </button>

          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">

            <Info
              label="Entity Type"
              value={state?.entityType?.charAt(0).toUpperCase() + state?.entityType?.slice(1)}
              icon={<Package size={14}/>}
            />

            <Info
              label="Entity"
              value={state?.entityName}
              icon={<Package size={14}/>}
            />

            <Info
              label="Auditor"
              value={state?.auditor}
              icon={<User size={14}/>}
            />

            <Info
              label="Date"
              value={state?.date}
              icon={<Calendar size={14}/>}
            />

            <Info
              label="Time"
              value={state?.time}
              icon={<Clock size={14}/>}
            />

          </div>

        </div>

        {/* SLOT */}

        {activeSlot && (

          <div className="max-w-6xl mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 mb-6">

            <h3 className="font-semibold mb-3 text-gray-700 dark:text-gray-200">
              Active Slot
            </h3>

            <div className="px-4 py-2 bg-green-500 text-white rounded-lg inline-block">

              {activeSlot.slot_id}
              {" "}
              ({activeSlot.start_time?.slice(0,5)} - {activeSlot.end_time?.slice(0,5)})

            </div>

          </div>

        )}

        {/* QUESTIONS */}

        <div className="max-w-6xl mx-auto space-y-6">

          {loading ? (
            <div className="text-center text-gray-500">Loading template...</div>
          ) : (

            fields.map(field => (

              <div
                key={field.id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6"
              >

                <Question
                  question={field}
                  value={answers[field.id]}
                  onChange={handleChange}
                />

              </div>

            ))

          )}

        </div>

        {/* SUBMIT */}

        <div className="max-w-6xl mx-auto mt-6 flex justify-end">

          <button
            onClick={handleSubmit}
            disabled={!activeSlot || submitting || !templateId}
            className="px-6 py-3 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Audit"}
          </button>

        </div>

      </div>

    </Layout>
  );

};

export default AuditTemplatePage;


/* INFO COMPONENT */

const Info = ({ label, value, icon }) => (

  <div>

    <div className="text-xs text-gray-500 flex items-center gap-1 mb-1">
      {icon}
      {label}
    </div>

    <div className="text-sm bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg text-gray-800 dark:text-white">
      {value || "-"}
    </div>

  </div>

);


const Question = ({ question, value, onChange }) => {

  const [location, setLocation] = useState(null);
  const [preview, setPreview] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [stream, setStream] = useState(null);

  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handleFile = (file) => {

    if (!file) return;

    const url = URL.createObjectURL(file);
    setPreview(url);

    onChange(question.id, file);

  };

  const openCamera = async () => {

    try {

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } }
      });

      setStream(mediaStream);
      setCameraOpen(true);

    } catch (err) {

      toast.error("Camera access denied");

    }

  };

  const capturePhoto = () => {

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");

    ctx.drawImage(video, 0, 0);

    const now = new Date();
    const date = now.toLocaleDateString("en-IN");
    const time = now.toLocaleTimeString("en-IN");

    const lat = location?.lat?.toFixed(5) || "N/A";
    const lng = location?.lng?.toFixed(5) || "N/A";

    const watermark = `${date} ${time} | ${lat}, ${lng}`;

    ctx.font = "20px Arial";
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(10, canvas.height - 45, 420, 35);

    ctx.fillStyle = "white";
    ctx.fillText(watermark, 15, canvas.height - 20);

    canvas.toBlob((blob) => {

      const file = new File(
        [blob],
        `audit_${Date.now()}.jpg`,
        { type: "image/jpeg" }
      );

      setPreview(URL.createObjectURL(file));

      onChange(question.id, file);

    }, "image/jpeg", 0.9);

    stream?.getTracks().forEach(track => track.stop());
    setCameraOpen(false);
    setStream(null);

  };

  /* ===============================
     SECTION
  =============================== */

  if (question.type === "section") {

    return (
      <div className="text-lg font-bold text-gray-800 dark:text-white">
        {question.label}
      </div>
    );

  }

  /* ===============================
     GROUP
  =============================== */

  if (question.type === "group") {

    return (
      <div className="text-sm font-semibold text-gray-500">
        {question.label}
      </div>
    );

  }

  /* ===============================
     TEXT
  =============================== */

  if (question.type === "text") {

    return (
      <div>
        <div className="text-sm mb-2">{question.label}</div>
        <input
          type="text"
          value={value || ""}
          placeholder={question.placeholder}
          onChange={(e) => onChange(question.id, e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>
    );

  }

  /* ===============================
     NUMBER
  =============================== */

  if (question.type === "number" || question.type === "temperature") {

    return (
      <div>
        <div className="text-sm mb-2">{question.label}</div>
        <input
          type="number"
          value={value || ""}
          placeholder={question.placeholder}
          onChange={(e) => onChange(question.id, e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>
    );

  }

  /* ===============================
     DATE
  =============================== */

  if (question.type === "date") {

    return (
      <div>
        <div className="text-sm mb-2">{question.label}</div>
        <input
          type="date"
          value={value || ""}
          onChange={(e) => onChange(question.id, e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>
    );

  }

  /* ===============================
     DATETIME
  =============================== */

  if (question.type === "datetime") {

    return (
      <div>
        <div className="text-sm mb-2">{question.label}</div>
        <input
          type="datetime-local"
          value={value || ""}
          onChange={(e) => onChange(question.id, e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>
    );

  }

  /* ===============================
     LIST
  =============================== */

  if (question.type === "list") {

    return (
      <div>
        <div className="text-sm mb-2">{question.label}</div>
        <select
          value={value || ""}
          onChange={(e) => onChange(question.id, e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="">Select</option>
          {(question.options || []).map((opt, i) => (
            <option key={i} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );

  }

  /* ===============================
     RADIO
  =============================== */

  if (question.type === "radio") {

    return (
      <div>
        <div className="text-sm mb-2">{question.label}</div>

        <div className="flex gap-4">

          {(question.options || []).map((opt, i) => (

            <label key={i} className="flex items-center gap-2">

              <input
                type="radio"
                name={question.id}
                checked={value === opt}
                onChange={() => onChange(question.id, opt)}
              />

              {opt}

            </label>

          ))}

        </div>

      </div>
    );

  }

  /* ===============================
     CHECKBOX
  =============================== */

  if (question.type === "checkbox") {

    return (
      <label className="flex items-center gap-2">

        <input
          type="checkbox"
          checked={value || false}
          onChange={(e) => onChange(question.id, e.target.checked)}
        />

        {question.label}

      </label>
    );

  }

  /* ===============================
     IMAGE
  =============================== */

  if (question.type === "image") {

    return (

      <div>

        <div className="text-sm mb-2">{question.label}</div>

        {preview && (
          <img
            src={preview}
            alt="preview"
            className="mb-3 rounded-lg max-h-48 border"
          />
        )}

        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => handleFile(e.target.files[0])}
          className="w-full px-3 py-2 border rounded-lg mb-2"
        />

        <button
          type="button"
          onClick={openCamera}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm"
        >
          Open Camera
        </button>

        {cameraOpen && (

          <div className="mt-3 space-y-2">

            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="rounded-lg border max-h-60"
            />

            <button
              type="button"
              onClick={capturePhoto}
              className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm"
            >
              Capture Photo
            </button>

            <canvas ref={canvasRef} style={{ display: "none" }} />

          </div>

        )}

      </div>

    );

  }

  /* BUTTON */

  if (question.type === "button") {

    return (
      <button
        type="button"
        className="px-4 py-2 bg-gray-900 text-white rounded-lg"
      >
        {question.label}
      </button>
    );

  }

  return null;

};