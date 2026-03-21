"use client";

import React, { useEffect, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import {
  addTopic,
  TOPIC_LEVEL_OPTIONS,
  TopicLevel,
} from "@/services/topicsService";
import { getSubjects } from "@/services/subjectService";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type TopicFormData = {
  name: string;
  description: string;
  subject: string;
  level: TopicLevel;
};

type TopicFormErrors = Record<keyof TopicFormData, string>;

export default function CreateTopicPage() {
  const [formData, setFormData] = useState<TopicFormData>({
    name: "",
    description: "",
    subject: "",
    level: "Beginner",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<TopicFormErrors>({
    name: "",
    description: "",
    subject: "",
    level: "",
  });

  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await getSubjects();
        const subjectOptions = response.subjects.map((subject: { id?: string; name?: string }) => ({
          id: subject.id || "",
          name: subject.name || "",
        }));
        setSubjects(subjectOptions.filter((subject) => subject.id));
      } catch (error) {
        console.error("Error fetching subjects:", error);
        toast.error("Loi khi tai danh sach mon hoc!");
      }
    };

    fetchSubjects();
  }, []);

  const handleChange = <K extends keyof TopicFormData>(field: K, value: TopicFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async () => {
    const newErrors: TopicFormErrors = {
      name: formData.name ? "" : "Ten chu de la bat buoc.",
      description: formData.description ? "" : "Mo ta la bat buoc.",
      subject: formData.subject ? "" : "Mon hoc la bat buoc.",
      level: formData.level ? "" : "Muc do la bat buoc.",
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some((errorMessage) => errorMessage)) {
      toast.warn("Vui long dien day du thong tin!");
      return;
    }

    setLoading(true);

    try {
      const created = await addTopic(formData);
      toast.success(`Da tao thanh cong chu de: ${created.name}`);

      setTimeout(() => {
        setFormData({
          name: "",
          description: "",
          subject: "",
          level: "Beginner",
        });
      }, 500);
    } catch (error) {
      console.error("[handleSubmit] Error creating topic:", error);
      toast.error("Tao chu de that bai!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        pauseOnHover
        closeOnClick
        draggable
        style={{ zIndex: 999999 }}
      />

      <PageBreadcrumb pageTitle="Tao chu de" />

      <div className="mx-auto mt-6 max-w-3xl space-y-6">
        <div>
          <h3 className="mb-2 text-lg font-semibold">
            Mon hoc <span className="text-red-500">*</span>
          </h3>
          <div className="relative">
            <select
              value={formData.subject}
              onChange={(event) => handleChange("subject", event.target.value)}
              className={`w-full appearance-none rounded-lg border bg-white px-3 py-2 dark:bg-dark-900 ${
                errors.subject ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">-- Chon mon hoc --</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          </div>
          {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject}</p>}
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold">
            Muc do <span className="text-red-500">*</span>
          </h3>
          <div className="relative">
            <select
              value={formData.level}
              onChange={(event) => handleChange("level", event.target.value as TopicLevel)}
              className={`w-full appearance-none rounded-lg border bg-white px-3 py-2 dark:bg-dark-900 ${
                errors.level ? "border-red-500" : "border-gray-300"
              }`}
            >
              {TOPIC_LEVEL_OPTIONS.map((levelOption) => (
                <option key={levelOption} value={levelOption}>
                  {levelOption}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          </div>
          {errors.level && <p className="mt-1 text-sm text-red-600">{errors.level}</p>}
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold">
            Ten chu de <span className="text-red-500">*</span>
          </h3>
          <Input
            type="text"
            value={formData.name}
            placeholder="Nhap ten chu de"
            maxLength={100}
            onChange={(event) => handleChange("name", event.target.value)}
            error={!!errors.name}
            hint={errors.name}
          />
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold">
            Mo ta <span className="text-red-500">*</span>
          </h3>
          <TextArea
            rows={6}
            placeholder="Nhap mo ta ngan gon ve chu de"
            value={formData.description}
            onChange={(value: string) => handleChange("description", value)}
            error={!!errors.description}
            hint={errors.description}
          />
        </div>

        <div className="pt-4 text-center">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="mx-auto flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {loading && (
              <svg
                className="h-5 w-5 animate-spin text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            )}
            {loading ? "Dang tao..." : "Tao chu de"}
          </button>
        </div>
      </div>
    </div>
  );
}
