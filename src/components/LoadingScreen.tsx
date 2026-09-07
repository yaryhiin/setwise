import { LoaderCircle } from "lucide-react";

function LoadingScreen() {
  return (
    <div className="loading">
      <LoaderCircle size={20} className="loading__spinner" />
      Loading...
    </div>
  );
}

export default LoadingScreen;
