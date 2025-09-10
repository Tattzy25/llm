import React from "react";

export type FrontBackCardProps = {
  imageUrl?: string;
  title?: string;
  description?: string;
  buttonText?: string;
  onButtonClick?: () => void;
  rightIcon?: React.ReactNode;
  className?: string;
};

/**
 * A gradient-framed card with a front (header) and back (content) section.
 * - Front: optional image + title + optional right icon
 * - Back (top): description box
 * No pricing/money content included.
 */
export default function FrontBackCard({
  imageUrl,
  title = "",
  description = "",
  buttonText,
  onButtonClick,
  rightIcon,
  className,
}: FrontBackCardProps) {
  return (
    <div
      className={[
  "w-[260px] rounded-[32px] p-[4px]",
  // Outer frame restored to original purple/blue gradient (only back & button are orange)
  "bg-gradient-to-tr from-[#975af4] via-[#2f7cf8] via-[#78aafa] to-[#934cff]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Back card container now orange gradient */}
      <div className="rounded-[30px] text-white text-[12px] flex flex-col bg-[linear-gradient(140deg,#ff8a3c_0%,#ff9f3c_35%,#ffb347_60%,#ffd26f_100%)] shadow-[0_4px_18px_-4px_rgba(255,138,60,0.45)] transition-colors">
        {/* Front (header) */}
        <div className="flex items-center justify-between text-white px-[18px] py-4">
          <div className="flex items-center gap-3 min-w-0">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={title || "card image"}
                className="size-10 rounded-full object-cover border border-white/30 shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
              />
            ) : null}
            {title ? (
              <p className="text-[14px] font-semibold italic drop-shadow-[2px_2px_6px_#2975ee] truncate">
                {title}
              </p>
            ) : (
              <span className="text-white/60 text-[12px]">&nbsp;</span>
            )}
          </div>
          <div className="shrink-0 text-white/90">
            {rightIcon ?? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={20}
                height={20}
                viewBox="0 0 24 24"
              >
                <path
                  fill="currentColor"
                  d="M10.277 16.515c.005-.11.187-.154.24-.058c.254.45.686 1.111 1.177 1.412c.49.3 1.275.386 1.791.408c.11.005.154.186.058.24c-.45.254-1.111.686-1.412 1.176s-.386 1.276-.408 1.792c-.005.11-.187.153-.24.057c-.254-.45-.686-1.11-1.176-1.411s-1.276-.386-1.792-.408c-.11-.005-.153-.187-.057-.24c.45-.254 1.11-.686 1.411-1.177c.301-.49.386-1.276.408-1.791m8.215-1c-.008-.11-.2-.156-.257-.062c-.172.283-.421.623-.697.793s-.693.236-1.023.262c-.11.008-.155.2-.062.257c.283.172.624.42.793.697s.237.693.262 1.023c.009.11.2.155.258.061c.172-.282.42-.623.697-.792s.692-.237 1.022-.262c.11-.009.156-.2.062-.258c-.283-.172-.624-.42-.793-.697s-.236-.692-.262-1.022M14.704 4.002l-.242-.306c-.937-1.183-1.405-1.775-1.95-1.688c-.545.088-.806.796-1.327 2.213l-.134.366c-.149.403-.223.604-.364.752c-.143.148-.336.225-.724.38l-.353.141l-.248.1c-1.2.48-1.804.753-1.881 1.283c-.082.565.49 1.049 1.634 2.016l.296.25c.325.275.488.413.58.6c.094.187.107.403.134.835l.024.393c.093 1.52.14 2.28.634 2.542s1.108-.147 2.336-.966l.318-.212c.35-.233.524-.35.723-.381c.2-.032.402.024.806.136l.368.102c1.422.394 2.133.591 2.52.188c.388-.403.196-1.14-.19-2.613l-.099-.381c-.11-.419-.164-.628-.134-.835s.142-.389.365-.752l.203-.33c.786-1.276 1.179-1.914.924-2.426c-.254-.51-.987-.557-2.454-.648l-.379-.024c-.417-.026-.625-.039-.806-.135c-.18-.096-.314-.264-.58-.6m-5.869 9.324C6.698 14.37 4.919 16.024 4.248 18c-.752-4.707.292-7.747 1.965-9.637c.144.295.332.539.5.73c.35.396.852.82 1.362 1.251l.367.31l.17.145c.005.064.01.14.015.237l.03.485c.04.655.08 1.294.178 1.805"
                />
              </svg>
            )}
          </div>
        </div>

        {/* Back (content) */}
        <div className="p-[18px] flex flex-col gap-[14px]">
          {description ? (
            <div className="bg-white/5 border-l-4 border-[#975af4] rounded-md p-3 text-[#bab9b9] text-[13px] leading-snug">
              {description}
            </div>
          ) : null}

          {/* Placeholder details (2 rows) */}
          <div className="grid grid-cols-1 gap-2 text-[12px]">
            <div className="flex items-center justify-between rounded-md border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-2">
              <span className="text-white/80">Model</span>
              <span className="text-white font-medium opacity-90">—</span>
            </div>
            <div className="flex items-center justify-between rounded-md border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-2">
              <span className="text-white/80">Downloads</span>
              <span className="text-white font-medium opacity-90">—</span>
            </div>
          </div>

          {buttonText ? (
            <button
              type="button"
              onClick={onButtonClick}
              className="w-full rounded-md py-2 text-white text-[12px] font-semibold transition-all duration-200 active:scale-95 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)] bg-[linear-gradient(95deg,#ff8a3c,#ff9f3c_35%,#ffb347_65%,#ffd26f_100%)] hover:scale-[1.03] hover:shadow-[0_4px_14px_-2px_rgba(255,138,60,0.55)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ffb347]/60"
            >
              {buttonText}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
