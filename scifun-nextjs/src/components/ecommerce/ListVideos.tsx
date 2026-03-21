"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getVideoLessons, VideoLesson, deleteVideoLesson } from "@/services/videosService";
import { Topic } from "@/services/topicsService";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";

export default function ListVideos() {
  const [videos, setVideos] = useState<VideoLesson[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);
  const limit = 5;

  const fetchVideos = async (page: number) => {
    setLoading(true);
    try {
      const response = await getVideoLessons(page, limit);
      setVideos(response.data);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Failed to fetch videos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos(currentPage);
  }, [currentPage]);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handleDelete = async (id: string) => {
    if (deletingVideoId) return;

    if (window.confirm("Ban co chac chan muon xoa video nay khong?")) {
      setDeletingVideoId(id);
      try {
        await deleteVideoLesson(id);
        await fetchVideos(currentPage);
      } catch (error) {
        console.error("Failed to delete video:", error);
        alert("Xoa video that bai!");
      } finally {
        setDeletingVideoId(null);
      }
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Danh sach Video</h3>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-10">
          <svg
            className="mb-3 h-6 w-6 animate-spin text-blue-500"
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
          <p className="text-gray-600 dark:text-gray-400">Dang tai du lieu...</p>
        </div>
      ) : (
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-y border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  Tieu de
                </TableCell>
                <TableCell isHeader className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  Thoi luong
                </TableCell>
                <TableCell isHeader className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  Chu de
                </TableCell>
                <TableCell isHeader className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  URL
                </TableCell>
                <TableCell isHeader className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  Hanh dong
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {videos.length > 0 ? (
                videos.map((video) => (
                  <TableRow key={video.id}>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
                            {video.title}
                          </p>
                          <span className="text-theme-xs text-gray-500 dark:text-gray-400">ID: {video.id}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-theme-sm text-gray-500 dark:text-gray-400">
                      {video.duration} giay
                    </TableCell>
                    <TableCell className="py-3 text-theme-sm text-gray-500 dark:text-gray-400">
                      {video.topic && typeof video.topic === "object"
                        ? (video.topic as Topic).name
                        : "N/A"}
                    </TableCell>
                    <TableCell className="py-3 text-theme-sm">
                      <a
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline dark:text-blue-400 dark:hover:underline"
                      >
                        <span className="truncate">{video.url}</span>
                      </a>
                    </TableCell>
                    <TableCell className="py-3 text-theme-sm">
                      <Link
                        href={`/update-video/${video.id}`}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                      >
                        Sua
                      </Link>
                      {deletingVideoId === video.id && (
                        <span className="ml-4 text-gray-500 dark:text-gray-400">Dang xoa...</span>
                      )}
                      <button
                        onClick={() => handleDelete(video.id)}
                        disabled={deletingVideoId !== null}
                        className="ml-4 text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:text-red-200"
                      >
                        Xoa
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-gray-500 dark:text-gray-400">
                    Khong tim thay video nao.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {!loading && (
        <div className="mt-4 flex items-center justify-end gap-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Trang {currentPage} / {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1 || deletingVideoId !== null}
              className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Truoc
            </button>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages || deletingVideoId !== null}
              className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}