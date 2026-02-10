const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Global rate limit handler
let rateLimitHandler: ((retryAfter?: number) => void) | null = null;

export function setRateLimitHandler(handler: (retryAfter?: number) => void) {
  rateLimitHandler = handler;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface BackendResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  pagination?: PaginationInfo;
  errors?: unknown;
  error?: unknown;
}

interface BackendBlog {
  _id?: string;
  id?: string;
  slug?: string;
  title?: string;
  description?: string;
  content?: string;
  tags?: string[];
  cover_image?: string;
  user_id?: {
    _id?: string;
    id?: string;
    name?: string;
    avatar?: string;
  };
  author?: {
    id: string;
    name: string;
    avatar?: string;    
  };
  status?: 'draft' | 'published';
  impression?: number;
  views?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Transform backend blog object to frontend format
function transformBlog(backendBlog: BackendBlog): Blog {
  return {
    id: backendBlog._id || backendBlog.id || '',
    slug: backendBlog.slug || '',
    title: backendBlog.title || '',
    description: backendBlog.description || '',
    content: backendBlog.content || '',
    tags: backendBlog.tags || [],
    coverImage: backendBlog.cover_image || '',
    author: {
      id: backendBlog.user_id?._id || backendBlog.user_id?.id || '',
      name: backendBlog.user_id?.name || 'Unknown',
      avatar: backendBlog.user_id?.avatar || '',
    },
    status: backendBlog.status || 'published',
    rejectionReason: backendBlog.rejectionReason,
    views: backendBlog.impression || backendBlog.views || 0,
    createdAt: backendBlog.createdAt || '',
    updatedAt: backendBlog.updatedAt || '',
  };
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('auth_token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle 429 Too Many Requests
    if (response.status === 429) {
      const retryAfterHeader = response.headers.get('Retry-After');
      const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined;
      
      if (rateLimitHandler) {
        rateLimitHandler(retryAfter);
      }
      
      return {
        error: 'Too many requests. Please slow down and try again.',
      };
    }

    const responseData: BackendResponse<unknown> = await response.json().catch(() => ({
      success: false,
      message: 'Invalid response format',
    }));

    if (!response.ok || !responseData.success) {
      const errorMessage = 
        (typeof responseData.message === 'string' ? responseData.message : null) ||
        (typeof responseData.error === 'string' ? responseData.error : null) ||
        `Error: ${response.status}`;
      return {
        error: errorMessage,
      };
    }

    return { data: responseData.data as T };
  } catch (error) {
    return { error: 'Network error. Please try again.' };
  }
}

// Helper function to get full backend response (including pagination)
async function apiRequestWithPagination(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data?: BackendResponse<BackendBlog[]>; error?: string }> {
  const token = localStorage.getItem('auth_token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle 429 Too Many Requests
    if (response.status === 429) {
      const retryAfterHeader = response.headers.get('Retry-After');
      const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined;
      
      if (rateLimitHandler) {
        rateLimitHandler(retryAfter);
      }
      
      return {
        error: 'Too many requests. Please slow down and try again.',
      };
    }

    const responseData: BackendResponse<BackendBlog[]> = await response.json().catch(() => ({
      success: false,
      message: 'Invalid response format',
    }));

    if (!response.ok || !responseData.success) {
      const errorMessage = 
        (typeof responseData.message === 'string' ? responseData.message : null) ||
        (typeof responseData.error === 'string' ? responseData.error : null) ||
        `Error: ${response.status}`;
      return {
        error: errorMessage,
      };
    }

    return { data: responseData };
  } catch (error) {
    return { error: 'Network error. Please try again.' };
  }
}

// Auth API
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export const authApi = {
  login: (data: LoginRequest) =>
    apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  register: (data: RegisterRequest) =>
    apiRequest<{ message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  forgotPassword: (data: ForgotPasswordRequest) =>
    apiRequest<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  resetPassword: (data: ResetPasswordRequest) =>
    apiRequest<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Blog API
export interface Blog {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  tags: string[];
  coverImage: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  status: 'draft' | 'published' | 'pending_approval' | 'rejected';
  rejectionReason?: string;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface BlogListResponse {
  blogs: Blog[];
  page: number;
  totalPages: number;
  total: number;
}

export interface CreateBlogRequest {
  title: string;
  description: string;
  content: string;
  tags: string[];
  coverImage?: string;
  status?: 'draft' | 'published';
}

export interface UpdateBlogRequest {
  title?: string;
  description?: string;
  content?: string;
  tags?: string[];
  coverImage?: string;
  status?: 'draft' | 'published';
}

export const blogApi = {
  getBlogs: async (page = 1, status = 'published', tag = '') => {
    const response = await apiRequestWithPagination(
      `/blog?page=${page}&status=${status}${tag ? `&tag=${tag}` : ''}`
    );
    
    if (response.error) {
      return { error: response.error };
    }

    // Backend returns: { success: true, message: "...", data: [...], pagination: {...} }
    const backendResponse = response.data!;
    const blogsArray = Array.isArray(backendResponse.data) 
      ? backendResponse.data 
      : [];
    
    const blogs = blogsArray.map(transformBlog);
    const pagination: PaginationInfo = backendResponse.pagination || {
      page,
      limit: 10,
      total: blogs.length,
      pages: 1,
    };
    
    return {
      data: {
        blogs,
        page: pagination.page,
        totalPages: pagination.pages,
        total: pagination.total,
      },
    };
  },

  getBlogBySlug: async (slug: string) => {
    const response = await apiRequest<BackendBlog>(`/blog/${slug}`);
    
    if (response.error) {
      return { error: response.error };
    }

    return {
      data: transformBlog(response.data),
    };
  },

  getMyBlogs: async (page = 1) => {
    const response = await apiRequestWithPagination(
      `/blog/my-blogs?page=${page}`
    );
    
    if (response.error) {
      return { error: response.error };
    }

    // Backend returns: { success: true, message: "...", data: [...], pagination: {...} }
    const backendResponse = response.data!;
    const blogsArray = Array.isArray(backendResponse.data) 
      ? backendResponse.data 
      : [];
    
    const blogs = blogsArray.map(transformBlog);
    const pagination: PaginationInfo = backendResponse.pagination || {
      page,
      limit: 10,
      total: blogs.length,
      pages: 1,
    };
    
    return {
      data: {
        blogs,
        page: pagination.page,
        totalPages: pagination.pages,
        total: pagination.total,
      },
    };
  },

  createBlog: async (data: CreateBlogRequest) => {
    // Transform camelCase to snake_case for backend
    const backendData: {
      title: string;
      description: string;
      content: string;
      tags: string[];
      status?: 'draft' | 'published';
      cover_image?: string;
    } = {
      title: data.title,
      description: data.description,
      content: data.content,
      tags: data.tags,
      status: data.status,
    };
    if (data.coverImage) {
      backendData.cover_image = data.coverImage;
    }
    
    const response = await apiRequest<BackendBlog>('/blog', {
      method: 'POST',
      body: JSON.stringify(backendData),
    });
    
    if (response.error) {
      return { error: response.error };
    }

    return {
      data: transformBlog(response.data),
    };
  },

  updateBlog: async (slug: string, data: UpdateBlogRequest) => {
    // Transform camelCase to snake_case for backend
    const backendData: {
      title?: string;
      description?: string;
      content?: string;
      tags?: string[];
      status?: 'draft' | 'published';
      cover_image?: string;
    } = {};
    if (data.title !== undefined) backendData.title = data.title;
    if (data.description !== undefined) backendData.description = data.description;
    if (data.content !== undefined) backendData.content = data.content;
    if (data.tags !== undefined) backendData.tags = data.tags;
    if (data.status !== undefined) backendData.status = data.status;
    if (data.coverImage !== undefined) backendData.cover_image = data.coverImage;
    
    const response = await apiRequest<BackendBlog>(`/blog/${slug}`, {
      method: 'PUT',
      body: JSON.stringify(backendData),
    });
    
    if (response.error) {
      return { error: response.error };
    }

    return {
      data: transformBlog(response.data),
    };
  },

  searchTags: async (query: string) => {
    const response = await apiRequest<Array<{ tag: string; count: number } | string>>(
      `/blog/tags/search?q=${encodeURIComponent(query)}`
    );
    
    if (response.error) {
      return { error: response.error };
    }

    // Transform tag objects to string array
    const tags = Array.isArray(response.data)
      ? response.data.map((item) => {
          if (typeof item === 'string') return item;
          if (typeof item === 'object' && item !== null && 'tag' in item) {
            return item.tag;
          }
          return String(item);
        })
      : [];
    
    return { data: tags };
  },
};
