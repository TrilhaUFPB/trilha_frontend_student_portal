"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  fetchAssignmentById, 
  updateAssignment,
  fetchAllSubmissions,
  fetchAllGroups
} from "@/utils/api";
import Link from "next/link";
import { AssignmentTeacherDashboard } from "@/types/interfaces";

export default function EditAssignmentPage({ params }: { params: { assignmentId: string } }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const assignmentId = parseInt(params.assignmentId);
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    github_link: "",
    due_date: "",
    is_group_work: false
  });
  
  const [originalAssignment, setOriginalAssignment] = useState<AssignmentTeacherDashboard | null>(null);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [hasSubmissions, setHasSubmissions] = useState(false);
  const [hasGroups, setHasGroups] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (!loading && user && user.role.name !== "teacher") {
      router.push("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user && user.role.name === "teacher") {
      loadAssignmentData();
    }
  }, [user, assignmentId]);

  const loadAssignmentData = async () => {
    try {
      setLoadingData(true);
      
      const [assignment, allSubmissions, allGroups] = await Promise.all([
        fetchAssignmentById(assignmentId),
        fetchAllSubmissions(),
        fetchAllGroups()
      ]);
      
      const assignmentData = assignment as AssignmentTeacherDashboard;
      setOriginalAssignment(assignmentData);
      
      // Check if assignment has submissions or groups
      const submissions = (allSubmissions as any[]).filter(s => s.assignment_id === assignmentId);
      const groups = (allGroups as any[]).filter(g => g.assignment_id === assignmentId);
      setHasSubmissions(submissions.length > 0);
      setHasGroups(groups.length > 0);
      
      // Populate form data
      setFormData({
        title: assignmentData.title,
        description: assignmentData.description,
        github_link: assignmentData.github_link || "",
        due_date: assignmentData.due_date ? new Date(assignmentData.due_date).toISOString().slice(0, 16) : "",
        is_group_work: assignmentData.is_group_work
      });
      
    } catch (error) {
      console.error("Error loading assignment data:", error);
      router.push("/teacher/assignments");
    } finally {
      setLoadingData(false);
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length < 3) {
      newErrors.title = "Title must be at least 3 characters long";
    } else if (formData.title.length > 100) {
      newErrors.title = "Title must be less than 100 characters";
    }
    
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.length < 10) {
      newErrors.description = "Description must be at least 10 characters long";
    } else if (formData.description.length > 2000) {
      newErrors.description = "Description must be less than 2000 characters";
    }
    
    if (formData.github_link && formData.github_link.trim()) {
      const githubRegex = /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/;
      if (!githubRegex.test(formData.github_link.trim())) {
        newErrors.github_link = "Please enter a valid GitHub repository URL (e.g., https://github.com/username/repo)";
      }
    }
    
    if (formData.due_date && formData.due_date.trim()) {
      const due_date = new Date(formData.due_date);
      const now = new Date();
      
      if (isNaN(due_date.getTime())) {
        newErrors.due_date = "Please enter a valid date";
      }
      // Allow past dates for editing (assignment might already be overdue)
    }
    
    // Check if assignment type can be changed
    if (originalAssignment && formData.is_group_work !== originalAssignment.is_group_work) {
      if (hasSubmissions || hasGroups) {
        newErrors.is_group_work = "Cannot change assignment type after submissions or groups have been created";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const assignmentData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        github_link: formData.github_link.trim() || undefined,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : undefined,
        is_group_work: formData.is_group_work
      };
      
      await updateAssignment(assignmentId, assignmentData);
      
      // Redirect to assignments list with success message
      router.push("/teacher/assignments?updated=true");
      
    } catch (error) {
      console.error("Error updating assignment:", error);
      setErrors({ submit: "Failed to update assignment. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPreviewDate = (dateStr: string) => {
    if (!dateStr) return "No due date";
    return new Date(dateStr).toLocaleString();
  };

  const getDaysUntilDue = () => {
    if (!formData.due_date) return null;
    const due_date = new Date(formData.due_date);
    const now = new Date();
    const diffTime = due_date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const hasChanges = () => {
    if (!originalAssignment) return false;
    
    const originaldue_date = originalAssignment.due_date 
      ? new Date(originalAssignment.due_date).toISOString().slice(0, 16)
      : "";
    
    return (
      formData.title !== originalAssignment.title ||
      formData.description !== originalAssignment.description ||
      formData.github_link !== (originalAssignment.github_link || "") ||
      formData.due_date !== originaldue_date ||
      formData.is_group_work !== originalAssignment.is_group_work
    );
  };

  if (loading || loadingData) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <h1 className="text-2xl font-bold mb-4">Loading...</h1>
      </main>
    );
  }

  if (!user || !originalAssignment) {
    return null;
  }

  const daysUntilDue = getDaysUntilDue();

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Edit Assignment</h1>
              <p className="text-gray-600 mt-2">Update assignment details and configuration</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                {showPreview ? "Hide Preview" : "Show Preview"}
              </button>
              <Link
                href={`/teacher/submissions/${assignmentId}`}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                View Submissions
              </Link>
              <Link
                href="/teacher/assignments"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Assignments
              </Link>
            </div>
          </div>
        </div>

        {/* Warning for existing submissions/groups */}
        {(hasSubmissions || hasGroups) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p className="text-yellow-800 font-medium">Active Assignment</p>
                <p className="text-yellow-700 text-sm">
                  This assignment has {hasSubmissions && `${hasSubmissions} submissions`}
                  {hasSubmissions && hasGroups && " and "}
                  {hasGroups && `${hasGroups} groups`}. 
                  Some changes may affect existing student work.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Assignment Details</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Assignment Title *
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., React Todo App, Database Design Project"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title}</p>}
                <p className="text-gray-500 text-sm mt-1">{formData.title.length}/100 characters</p>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={6}
                  placeholder="Describe the assignment objectives, requirements, and any specific instructions..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
                <p className="text-gray-500 text-sm mt-1">{formData.description.length}/2000 characters</p>
              </div>

              {/* GitHub Link */}
              <div>
                <label htmlFor="github_link" className="block text-sm font-medium text-gray-700 mb-2">
                  Reference Repository (Optional)
                </label>
                <input
                  id="github_link"
                  name="github_link"
                  type="url"
                  value={formData.github_link}
                  onChange={handleInputChange}
                  placeholder="https://github.com/username/repository"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.github_link && <p className="text-red-600 text-sm mt-1">{errors.github_link}</p>}
                <p className="text-gray-500 text-sm mt-1">Link to a reference repository or starter code</p>
              </div>

              {/* Due Date */}
              <div>
                <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date (Optional)
                </label>
                <input
                  id="due_date"
                  name="due_date"
                  type="datetime-local"
                  value={formData.due_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.due_date && <p className="text-red-600 text-sm mt-1">{errors.due_date}</p>}
                {daysUntilDue !== null && (
                  <p className={`text-sm mt-1 ${
                    daysUntilDue < 0 ? 'text-red-600' : 
                    daysUntilDue <= 7 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {daysUntilDue < 0 ? `Overdue by ${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) !== 1 ? 's' : ''}` :
                     daysUntilDue === 0 ? 'Due today' :
                     `Due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`}
                  </p>
                )}
              </div>

              {/* Assignment Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Assignment Type *
                </label>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      id="individual"
                      name="is_group_work"
                      type="radio"
                      checked={!formData.is_group_work}
                      onChange={() => setFormData(prev => ({ ...prev, is_group_work: false }))}
                      disabled={hasSubmissions || hasGroups}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 disabled:opacity-50"
                    />
                    <label htmlFor="individual" className="ml-3 block text-sm text-gray-700">
                      <span className="font-medium">Individual Assignment</span>
                      <p className="text-gray-500">Students work independently on this assignment</p>
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="group"
                      name="is_group_work"
                      type="radio"
                      checked={formData.is_group_work}
                      onChange={() => setFormData(prev => ({ ...prev, is_group_work: true }))}
                      disabled={hasSubmissions || hasGroups}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 disabled:opacity-50"
                    />
                    <label htmlFor="group" className="ml-3 block text-sm text-gray-700">
                      <span className="font-medium">Group Assignment</span>
                      <p className="text-gray-500">Students can form groups and work collaboratively</p>
                    </label>
                  </div>
                </div>
                {(hasSubmissions || hasGroups) && (
                  <p className="text-yellow-600 text-sm mt-2">
                    Assignment type cannot be changed after submissions or groups are created
                  </p>
                )}
                {errors.is_group_work && <p className="text-red-600 text-sm mt-1">{errors.is_group_work}</p>}
              </div>

              {/* Submit Error */}
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 text-sm">{errors.submit}</p>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting || !hasChanges()}
                  className="flex-1 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Updating Assignment..." : hasChanges() ? "Update Assignment" : "No Changes"}
                </button>
                <Link
                  href="/teacher/assignments"
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors text-center"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>

          {/* Preview Section */}
          {showPreview && (
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Assignment Preview</h2>
              
              <div className="space-y-4">
                {/* Preview Header */}
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {formData.title || "Assignment Title"}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      formData.is_group_work 
                        ? "bg-purple-100 text-purple-800" 
                        : "bg-blue-100 text-blue-800"
                    }`}>
                      {formData.is_group_work ? "Group Work" : "Individual"}
                    </span>
                    {daysUntilDue !== null && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                        daysUntilDue < 0 ? "bg-red-100 text-red-800 border-red-200" :
                        daysUntilDue <= 3 ? "bg-yellow-100 text-yellow-800 border-yellow-200" :
                        "bg-green-100 text-green-800 border-green-200"
                      }`}>
                        {daysUntilDue < 0 ? "Overdue" : 
                         daysUntilDue === 0 ? "Due Today" :
                         `Due in ${daysUntilDue} days`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Preview Description */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Description</h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-600 whitespace-pre-wrap">
                      {formData.description || "Assignment description will appear here..."}
                    </p>
                  </div>
                </div>

                {/* Preview Details */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Details</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Due Date:</strong> {formatPreviewDate(formData.due_date)}</p>
                    <p><strong>Type:</strong> {formData.is_group_work ? "Group Assignment" : "Individual Assignment"}</p>
                    {formData.github_link && (
                      <p><strong>Reference:</strong> 
                        <a href={formData.github_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                          GitHub Repository →
                        </a>
                      </p>
                    )}
                  </div>
                </div>

                {/* Changes Summary */}
                {hasChanges() && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-800 mb-2">Changes Summary</h4>
                    <div className="text-green-700 text-sm space-y-1">
                      {formData.title !== originalAssignment.title && (
                        <p>• Title updated</p>
                      )}
                      {formData.description !== originalAssignment.description && (
                        <p>• Description updated</p>
                      )}
                      {formData.github_link !== (originalAssignment.github_link || "") && (
                        <p>• Reference repository updated</p>
                      )}
                      {formData.due_date !== (originalAssignment.due_date ? new Date(originalAssignment.due_date).toISOString().slice(0, 16) : "") && (
                        <p>• Due date updated</p>
                      )}
                      {formData.is_group_work !== originalAssignment.is_group_work && (
                        <p>• Assignment type changed</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 