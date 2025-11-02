"use client"
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Course, Video } from "@/types/interfaces";
import { useAuth } from "@/context/AuthContext";
import { fetchCoursesById, updateCourses, updateVideos, deleteVideos, fetchAllCourses } from "@/utils/api";

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = Number(params.courseId);

  const { user, loading } = useAuth();
  const [loadingData, setLoadingData] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);

  // Inline video editing state
  const [editingVideoId, setEditingVideoId] = useState<number | null>(null);
  const [editingVideoData, setEditingVideoData] = useState<{ title: string; description: string; CourseId: number; url: string }>({
    title: '',
    description: '',
    CourseId: 0,
    url: ''
  });

  // Auth check
  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else if (user.role.name !== "admin" && user.role.name !== "teacher") {
        router.push("/");
      }
    }
  }, [loading, user, router]);

  // Load course and videos
  useEffect(() => {
    const loadCourse = async () => {
      try {
        setLoadingData(true);
        const data = await fetchCoursesById(courseId) as Course;

        const normalizedVideos = (data.videos ?? []).map(v => ({
          ...v,
          CourseId: (v as any).CourseId ?? (v as any).courseid ?? 0, // <-- normalize field
        }));

        console.log("Videos loaded:", normalizedVideos);

        setCourse(data);
        setVideos(normalizedVideos);

      } catch (e) {
        console.error("Failed to load course", e);
      } finally {
        setLoadingData(false);
      }
    };

    if (user) loadCourse();
  }, [user, courseId]);

  useEffect(() => {
    const loadAllCourses = async () => {
      try {
        const courses = (await fetchAllCourses()) as Course[];
        setAllCourses(courses);
      } catch (e) {
        console.error("Failed to load all courses", e);
      }
    };

    loadAllCourses(); // call the async function
  }, []);

  // Course input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!course) return;
    const { name, value } = e.target;
    setCourse({ ...course, [name]: value });
  };

  // Save course update
  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course) return;

    try {
      const courseData = {
        title: course.title,
        description: course.description
      }

      console.log("Sending course update:", { courseId, courseData });

      await updateCourses(courseId, courseData);
      router.push(`/teacher/courses/${courseId}`);
    } catch (e) {
      console.error("Failed to update course", e);
      alert("Failed to update course. Please try again.");
    }
  };

  // Start editing a video
  const startEditing = (video: Video) => {
    setEditingVideoId(video.id);
    setEditingVideoData({
      title: video.title,
      description: video.description,
      CourseId: video.CourseId,
      url: video.url ?? ""
    });
  };

  // Handle input change for video
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditingVideoData(prev => ({ ...prev, [name]: value }));
  };

  // Save video update
  const handleSaveVideo = async (videoId: number) => {
    const video = videos.find(v => v.id === videoId)
    if (!video) return

    const payload = {
      title: editingVideoData.title,
      description: editingVideoData.description,
      CourseId: editingVideoData.CourseId,
      url: editingVideoData.url ?? ""
    }

    console.log("Sending video update:", { videoId, payload });

    try {
      await updateVideos(videoId, payload);
      setVideos(videos.map(v => v.id === videoId ? { ...v, ...editingVideoData } : v))
      setEditingVideoId(null)
    } catch (e) {
      console.error("Failed to update video", e)
    }
  };

  // Delete video
  const handleDeleteVideo = async (videoId: number) => {
    try {
      await deleteVideos(videoId);
      setVideos(videos.filter(v => v.id !== videoId));
    } catch (e) {
      console.error("Failed to delete video", e);
    }
  };

  if (loadingData) return <div>Loading course...</div>;
  if (!course) return <div>Course not found.</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow rounded-xl space-y-8">
      <h1 className="text-2xl font-bold">Edit Course</h1>

      {/* Edit Course Form */}
      <form onSubmit={handleUpdateCourse} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input
            type="text"
            name="title"
            value={course.title}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea
            name="description"
            value={course.description}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Save Changes
        </button>
      </form>

      {/* Linked Videos */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Linked Videos</h2>
        {videos.length === 0 ? (
          <p>No videos linked to this course.</p>
        ) : (
          <ul className="space-y-4">
            {videos.map(video => (
              <li key={video.id} className="flex flex-col bg-gray-100 p-3 rounded space-y-2">
                {editingVideoId === video.id ? (
                  <>
                    <input
                      type="text"
                      name="title"
                      value={editingVideoData.title}
                      onChange={handleVideoChange}
                      className="border p-1 rounded w-full"
                    />
                    <textarea
                      name="description"
                      value={editingVideoData.description}
                      onChange={handleVideoChange}
                      className="border p-1 rounded w-full"
                    />
                    <input
                      type="text"
                      name="url"
                      value={editingVideoData.url}
                      onChange={handleVideoChange}
                      className="border p-1 rounded w-full"
                      placeholder="Video URL"
                    />
                    <label className="block text-sm font-medium">Course</label>
                    <select
                      name="CourseId"
                      value={editingVideoData.CourseId}
                      onChange={(e) => setEditingVideoData(prev => ({ ...prev, CourseId: Number(e.target.value) }))}
                      className="border p-1 rounded w-full"
                    >
                      {allCourses.map(course => (
                        <option key={course.id} value={course.id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSaveVideo(video.id)}
                        className="px-3 py-1 bg-green-500 text-white rounded"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingVideoId(null)}
                        className="px-3 py-1 bg-gray-500 text-white rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="font-bold">{video.title}</span>
                    <p>{video.description}</p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => startEditing(video)}
                        className="px-3 py-1 bg-blue-500 text-white rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteVideo(video.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
