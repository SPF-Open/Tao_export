export function parseAccept(accept: string) {
  return accept
    .split(",")
    .map((type) => type.trim().toLowerCase())
    .filter(Boolean);
}

export function formatAcceptLabel(acceptedTypes: string[]) {
  const readableTypes = acceptedTypes.filter((type) => type.startsWith("."));
  const labels = readableTypes.length ? readableTypes : acceptedTypes;

  if (labels.length === 0) return "the requested file type";
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} or ${labels[1]}`;

  return `${labels.slice(0, -1).join(", ")}, or ${labels.at(-1)}`;
}

export function matchesAcceptedType(selectedFile: File, acceptedTypes: string[]) {
  if (acceptedTypes.length === 0) return true;

  const fileType = selectedFile.type.toLowerCase();
  const fileName = selectedFile.name.toLowerCase();
  const dotIndex = fileName.lastIndexOf(".");
  const fileExtension = dotIndex >= 0 ? fileName.slice(dotIndex) : "";

  return acceptedTypes.some((type) => {
    if (type.startsWith(".")) return fileExtension === type;
    if (type.endsWith("/*")) return fileType.startsWith(type.slice(0, -1));
    return fileType === type;
  });
}

export function buildUnsupportedFileMessage(acceptedTypes: string[]) {
  return `Unsupported file. Use ${formatAcceptLabel(acceptedTypes)}.`;
}
