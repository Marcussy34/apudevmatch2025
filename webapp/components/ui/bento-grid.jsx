import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const BentoGrid = ({ children, className, ...props }) => {
  return (
    <div
      className={cn(
        "grid w-full auto-rows-[24rem] grid-cols-1 md:grid-cols-3 gap-6",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const BentoCard = ({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
  ...props
}) => (
  <div
    key={name}
    className={cn(
      "group relative flex flex-col justify-between overflow-hidden rounded-xl border",
      // Enhanced styling to match the original design
      "bg-gradient-to-br from-gray-900/80 to-black/90 border-gray-700/30 hover:border-blue-400/40",
      "transition-all duration-300 hover:scale-[1.02] shadow-xl hover:shadow-2xl",
      "backdrop-blur-sm",
      className,
    )}
    {...props}
  >
    {/* Background animations */}
    <div className="absolute inset-0">{background}</div>
    
    {/* Subtle overlay for better text readability */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
    
    <div className="relative z-10 p-8 flex flex-col justify-between h-full">
      <div className="space-y-4">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500/80 to-purple-600/80 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
          <Icon className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-white group-hover:text-blue-300 transition-colors duration-300">
          {name}
        </h3>
        <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors duration-300">
          {description}
        </p>
      </div>

      {/* CTA Link - Always visible on mobile, hover-revealed on desktop */}
      <div className="mt-6 lg:opacity-0 lg:translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
        <a 
          href={href} 
          className="inline-flex items-center text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200"
        >
          {cta}
          <ArrowRightIcon className="ml-2 h-4 w-4" />
        </a>
      </div>
    </div>

    {/* Subtle hover glow effect */}
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-transparent pointer-events-none" />
  </div>
);

export { BentoCard, BentoGrid };
