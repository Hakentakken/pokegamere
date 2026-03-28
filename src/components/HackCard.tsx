import { useNavigate } from "react-router-dom";

type Props = {
  id: string;
  title: string;
  author: string;
  rating: number;
  baseGame: string;
  platform: string;
  status: string;
  coverImage: string;
  description: string;
};

export default function HackCard(props: Props) {
  const navigate = useNavigate();

  return (
    <div className="group glass rounded-2xl overflow-hidden transition duration-300 hover:scale-[1.04] hover:shadow-xl hover:shadow-red-500/20">

      {/* IMAGE */}
      <div className="relative">
        <img
          src={props.coverImage || "https://via.placeholder.com/400x200"}
          className="w-full h-48 object-cover transition duration-300 group-hover:scale-110"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

        {/* Status Badge (top-right) */}
        <div className="absolute top-3 right-3">
          <span className="bg-green-500/90 text-xs px-3 py-1 rounded-full shadow">
            {props.status || "Unknown"}
          </span>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-4 space-y-3">

        {/* Title */}
        <h2 className="text-lg font-bold group-hover:text-red-500 transition">
          {props.title}
        </h2>

        {/* Author */}
        <p className="text-sm text-gray-400">
          by {props.author || "Unknown"}
        </p>

        {/* Badges */}
        <div className="flex gap-2 text-xs flex-wrap">
          <span className="bg-red-500/80 px-3 py-1 rounded-full">
            {props.baseGame || "Unknown"}
          </span>
          <span className="bg-blue-500/80 px-3 py-1 rounded-full">
            {props.platform || "Unknown"}
          </span>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1 text-yellow-400 text-sm">
          {"⭐".repeat(Math.round(props.rating || 0))}
          <span className="text-gray-400 text-xs ml-1">
            ({props.rating || 0})
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-400 line-clamp-2">
          {props.description || "No description available."}
        </p>

        {/* Buttons */}
        <div className="flex gap-2 pt-2">

          <button
            onClick={() => navigate(`/hack/${props.id}`)}
            className="flex-1 bg-red-500 hover:bg-red-600 py-2 rounded-lg text-sm transition font-medium"
          >
            Details
          </button>

          <button
            onClick={() => navigate("/patcher")}
            className="flex-1 border border-white/20 hover:bg-white hover:text-black py-2 rounded-lg text-sm transition font-medium"
          >
            Patch
          </button>

        </div>

      </div>
    </div>
  );
}