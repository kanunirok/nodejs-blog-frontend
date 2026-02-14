import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { blogApi } from '@/lib/api';
import { APP_NAME } from '@/lib/appName';
import { Header } from '@/components/Header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import BlogComment from '@/components/BlogComment';
import { Eye, Calendar, Edit } from 'lucide-react';

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function calculateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

function upsertMetaTag(attribute: 'name' | 'property', key: string, content: string): void {
  let tag = document.head.querySelector(`meta[${attribute}="${key}"]`) as HTMLMetaElement | null;

  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
  }

  tag.setAttribute('content', content);
}

function upsertLinkTag(rel: string, href: string): void {
  let tag = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;

  if (!tag) {
    tag = document.createElement('link');
    tag.setAttribute('rel', rel);
    document.head.appendChild(tag);
  }

  tag.setAttribute('href', href);
}

function resetToDefaultSeo(): void {
  const defaultTitle = APP_NAME;
  const defaultDescription = APP_NAME;
  const homeUrl = `${window.location.origin}/`;

  document.title = defaultTitle;
  upsertMetaTag('name', 'description', defaultDescription);
  upsertMetaTag('property', 'og:title', defaultTitle);
  upsertMetaTag('property', 'og:description', defaultDescription);
  upsertMetaTag('property', 'og:type', 'website');
  upsertMetaTag('property', 'og:url', homeUrl);
  upsertMetaTag('name', 'twitter:card', 'summary');
  upsertMetaTag('name', 'twitter:title', defaultTitle);
  upsertMetaTag('name', 'twitter:description', defaultDescription);
  upsertLinkTag('canonical', homeUrl);
}

function buildSeoDescription(description?: string, content?: string): string {
  const fallback = `${APP_NAME} blog post`;
  const rawText = (description || content || fallback)
    .replace(/[\*_`>#\[\]\(\)!-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!rawText) return fallback;
  return rawText.length > 160 ? `${rawText.slice(0, 157)}...` : rawText;
}

export default function BlogDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: blog, isLoading, error } = useQuery({
    queryKey: ['blog', slug],
    queryFn: async () => {
      if (!slug) throw new Error('Blog slug is required');
      const response = await blogApi.getBlogBySlug(slug);
      if (response.data) return response.data;
      throw new Error(response.error);
    },
    enabled: !!slug && !authLoading,
  });

  const isOwner = isAuthenticated && user && blog && user.id === blog.author.id;
  // Only owners can view draft, pending_approval, or rejected blogs
  const isPrivateStatus = blog && ['draft', 'pending_approval', 'rejected'].includes(blog.status);
  const isDraftAndNotOwner = isPrivateStatus && !isOwner;

  useEffect(() => {
    if (authLoading || isLoading || !slug) return;

    const canonicalUrl = `${window.location.origin}/blog/${slug}`;

    if (error || !blog || isDraftAndNotOwner) {
      const notFoundTitle = `Blog Not Found | ${APP_NAME}`;
      const notFoundDescription = `${APP_NAME} blog post not found.`;

      document.title = notFoundTitle;
      upsertMetaTag('name', 'description', notFoundDescription);
      upsertMetaTag('property', 'og:title', notFoundTitle);
      upsertMetaTag('property', 'og:description', notFoundDescription);
      upsertMetaTag('property', 'og:type', 'article');
      upsertMetaTag('property', 'og:url', canonicalUrl);
      upsertMetaTag('name', 'twitter:card', 'summary');
      upsertMetaTag('name', 'twitter:title', notFoundTitle);
      upsertMetaTag('name', 'twitter:description', notFoundDescription);
      upsertLinkTag('canonical', canonicalUrl);
      return;
    }

    const seoTitle = `${blog.title} | ${APP_NAME}`;
    const seoDescription = buildSeoDescription(blog.description, blog.content);
    const seoImage = blog.coverImage || '';
    const keywords = Array.isArray(blog.tags) ? blog.tags.join(', ') : '';

    document.title = seoTitle;
    upsertMetaTag('name', 'description', seoDescription);
    if (keywords) {
      upsertMetaTag('name', 'keywords', keywords);
    }

    upsertMetaTag('property', 'og:title', seoTitle);
    upsertMetaTag('property', 'og:description', seoDescription);
    upsertMetaTag('property', 'og:type', 'article');
    upsertMetaTag('property', 'og:url', canonicalUrl);
    if (seoImage) {
      upsertMetaTag('property', 'og:image', seoImage);
    }

    upsertMetaTag('name', 'twitter:card', seoImage ? 'summary_large_image' : 'summary');
    upsertMetaTag('name', 'twitter:title', seoTitle);
    upsertMetaTag('name', 'twitter:description', seoDescription);
    if (seoImage) {
      upsertMetaTag('name', 'twitter:image', seoImage);
    }

    upsertLinkTag('canonical', canonicalUrl);
  }, [authLoading, isLoading, slug, error, blog, isDraftAndNotOwner]);

  useEffect(() => {
    return () => {
      resetToDefaultSeo();
    };
  }, []);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-[680px] px-4 py-12">
          <Skeleton className="mb-4 h-12 w-3/4" />
          <Skeleton className="mb-8 h-6 w-1/2" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !blog || isDraftAndNotOwner) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-[680px] px-4 py-12 text-center">
          <h1 className="mb-4 text-2xl font-semibold">Blog not found</h1>
          <p className="text-muted-foreground">
            The blog you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
        </main>
      </div>
    );
  }

  const readTime = calculateReadTime(blog.content);
  const fallbackAvatar = '/placeholder.svg';

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <article className="mx-auto max-w-[680px] px-4 py-12">
        <header className="mb-12">
          <div className="mb-6 flex items-start justify-between gap-4">
            <h1 className="flex-1 font-serif text-4xl font-bold leading-tight text-foreground md:text-5xl">
              {blog.title}
            </h1>
            {isOwner && (
              <Button asChild variant="outline" size="sm" className="shrink-0 gap-2">
                <Link to={`/write/${blog.slug}`}>
                  <Edit className="h-4 w-4" />
                  Edit
                </Link>
              </Button>
            )}
          </div>

          {/* Status Badge for Owner */}
          {isOwner && blog.status !== 'published' && (
            <div className="mb-4">
              <Badge
                variant={
                  blog.status === 'rejected'
                    ? 'destructive'
                    : blog.status === 'pending_approval'
                      ? 'secondary'
                      : 'secondary'
                }
                className="text-xs"
              >
                {blog.status === 'pending_approval'
                  ? 'Pending Approval'
                  : blog.status === 'rejected'
                    ? 'Rejected'
                    : blog.status}
              </Badge>
              {blog.status === 'rejected' && blog.rejectionReason && (
                <p className="mt-2 text-sm text-destructive">{blog.rejectionReason}</p>
              )}
            </div>
          )}

          <p className="mb-8 text-xl leading-relaxed text-muted-foreground">
            {blog.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 border-y border-border py-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/5">
                <img
                  src={blog.author.avatar || fallbackAvatar}
                  alt={blog.author.name}
                  className="h-6 w-6 rounded-full object-cover"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = fallbackAvatar;
                  }}
                />
              </div>
              <div>
                <p className="font-medium text-foreground">{blog.author.name}</p>
                <p className="text-xs">{readTime} min read</p>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(blog.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {blog.views} views
              </span>
            </div>
          </div>
        </header>

        <div className="prose-blog">
          {blog.coverImage && (
            <img src={blog.coverImage} alt={blog.title} className="mb-8 h-auto w-full rounded-lg" />
          )}
          <ReactMarkdown>{blog.content}</ReactMarkdown>
        </div>

        {blog.tags.length > 0 && (
          <footer className="mt-12 border-t border-border pt-8">
            <div className="flex flex-wrap gap-2">
              {blog.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-sm">
                  {tag}
                </Badge>
              ))}
            </div>
          </footer>
        )}

        <section className="mt-16 border-t border-border pt-8">
          <BlogComment blog={blog} />
        </section>
      </article>
    </div>
  );
}
