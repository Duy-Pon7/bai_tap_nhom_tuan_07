"use client";
import React, { useEffect, useState } from "react";
import Badge from "../ui/badge/Badge";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BoxIconLine,
  GroupIcon,
  BoxIcon,
} from "@/icons";
import { getUsers } from "@/services/userService";
import { getTopics } from "@/services/topicsService";

export const EcommerceMetrics = () => {
  const [userCount, setUserCount] = useState<number | null>(null);
  const [topicCount, setTopicCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        // We only need the total count, so we can request just 1 item on page 1
        const userData = await getUsers(1, 1);
        setUserCount(userData.total);
      } catch (error) {
        console.error("Failed to fetch user count:", error);
        setUserCount(0); // Or handle error appropriately
      }
    };

    const fetchTopicCount = async () => {
      try {
        const topicData = await getTopics(1, 1);
        setTopicCount(topicData.total);
      } catch (error) {
        console.error("Failed to fetch topic count:", error);
        setTopicCount(0);
      }
    };

    fetchUserCount();
    fetchTopicCount();
  }, []);
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Customers
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {userCount === null ? "Loading..." : userCount.toLocaleString()}
            </h4>
          </div>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}
      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <BoxIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Topics
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {topicCount === null ? "Loading..." : topicCount.toLocaleString()}
            </h4>
          </div>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}

      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <BoxIconLine className="text-gray-800 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Orders
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              5,359
            </h4>
          </div>

          <Badge color="error">
            <ArrowDownIcon className="text-error-500" />
            9.05%
          </Badge>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}
    </div>
  );
};
