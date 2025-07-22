---
title: Upload media
description: "Use Whop to upload images, videos, audio, and other files."
---

### Client-Side: Set up the Image Upload Component

First, create a component to handle image uploads. This example uses `react-dropzone` for the file upload interface.

```typescript
import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";

function ImageUploader() {
  // Set up state for the image file and preview
  const [image, setImage] = useState<{
    file: File;
    preview: string;
  } | null>(null);

  // Clean up object URLs when component unmounts
  useEffect(() => {
    const objectUrl = image?.preview;
    if (objectUrl) {
      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    }
  }, [image?.preview]);

  // Handle file drops
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setImage({
        file,
        preview: URL.createObjectURL(file),
      });
    }
  }, []);

  // Configure dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif"],
    },
    maxFiles: 1,
  });

  return (
    <div {...getRootProps()} className="border-2 border-dashed rounded-lg p-8">
      <input {...getInputProps()} />
      {image?.preview ? (
        <img src={image.preview} alt="Preview" className="max-w-full h-auto" />
      ) : (
        <p>Drag & drop an image here, or click to select</p>
      )}
    </div>
  );
}
```

### Server-Side: Handle File Uploads

Create an API route to handle the file upload using the Whop SDK:

```typescript
import { whopSdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Verify user authentication
    const headersList = await headers();
    const userToken = await whopSdk.verifyUserToken(headersList);
    if (!userToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the file from the request
    const file = await request.blob();

    // Upload to Whop
    const response = await whopSdk.attachments.uploadAttachment({
      file: new File([file], `upload-${Date.now()}.png`, {
        type: "image/png",
      }),
      record: "forum_post", // or other record types
    });

    // The response includes the directUploadId and URL
    return NextResponse.json({
      success: true,
      attachmentId: response.directUploadId,
      url: response.attachment.source.url,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
```

### Using Uploaded Media

After uploading, you can use the attachment ID in various Whop features. For example, to create a forum post with the uploaded image (server-side):

```typescript
const createForumPost = async (attachmentId: string) => {
  const post = await whopSdk.forums.createForumPost({
    forumExperienceId: "your-forum-id",
    content: "Check out this image!",
    attachments: [{ directUploadId: attachmentId }],
  });

  return post;
};
```

### Supported File Types

The Whop API supports the following file types for upload:

- Images: `.jpg`, `.jpeg`, `.png`, `.gif`
- Videos: `.mp4`, `.mov`
- Documents: `.pdf`

### Best Practices

1. **File Size**: Keep uploads under 100MB for optimal performance
2. **Image Optimization**: Consider using libraries like `sharp` for image processing before upload
3. **Error Handling**: Implement proper error handling on both client and server
4. **Clean Up**: Remember to clean up any preview URLs to prevent memory leaks
5. **Security**: Always verify user authentication before handling uploads
6. **Progress Tracking**: Consider implementing upload progress tracking for better UX

### Complete Example

Here's a complete example showing both client and server integration:

```typescript
// app/components/MediaUploader.tsx (Client)
import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";

export default function MediaUploader() {
  const [image, setImage] = useState<{
    file: File;
    preview: string;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    return () => {
      if (image?.preview) {
        URL.revokeObjectURL(image.preview);
      }
    };
  }, [image]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setImage({
        file,
        preview: URL.createObjectURL(file),
      });
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif"],
    },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!image?.file) return;

    setIsUploading(true);
    try {
      // Send to your API route
      const formData = new FormData();
      formData.append("file", image.file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      // Clear the form after successful upload
      setImage(null);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className="border-2 border-dashed rounded-lg p-8"
      >
        <input {...getInputProps()} />
        {image?.preview ? (
          <img
            src={image.preview}
            alt="Preview"
            className="max-w-full h-auto"
          />
        ) : (
          <p>Drag & drop an image here, or click to select</p>
        )}
      </div>

      {image && (
        <button
          onClick={handleUpload}
          disabled={isUploading}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          {isUploading ? "Uploading..." : "Upload"}
        </button>
      )}
    </div>
  );
}
```

This implementation provides a complete media upload solution with:

- Drag and drop interface
- File preview
- Upload handling
- Progress states
- Error handling
- Automatic cleanup
