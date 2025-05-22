import type { AttachmentFragment } from "@/codegen/generated-api";
import type { FileAttachment } from "@/codegen/proto/common/attachment";

/**
 * Parses a FileAttachment from the proto to an AttachmentFragment
 * @param file - The proto FileAttachment to parse
 * @returns The parsed AttachmentFragment
 */
export function parseAttachment(file: FileAttachment): AttachmentFragment {
	const shared = {
		id: file.id,
		signedId: file.signedId,
		contentType: file.contentType,
		analyzed: file.analyzed,
		byteSizeV2: file.byteSize.toString(),
		filename: file.fileName,
		source: {
			url: file.originalUrl,
		},
	};
	if (file.image) {
		return {
			__typename: "ImageAttachment" as const,
			...shared,
			// image specific fields
			height: file.image.height,
			width: file.image.width,
			blurhash: file.image.blurhash,
		};
	}
	if (file.video) {
		return {
			__typename: "VideoAttachment" as const,
			...shared,
			// video specific fields
			height: file.video.height,
			width: file.video.width,
			duration: file.video.durationSecs,
			preview: {
				url: file.video.thumbnailUrl,
			},
		};
	}
	if (file.audio) {
		return {
			__typename: "AudioAttachment" as const,
			...shared,
			// audio specific fields
			duration: file.audio.durationSecs,
		};
	}

	return {
		__typename: "OtherAttachment" as const,
		...shared,
	};
}
