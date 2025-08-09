import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  ShieldCheckIcon,
  UserGroupIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline'

const StatBox = ({
  label,
  value,
  icon,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
}) => (
  <div className="flex-1 min-w-[120px] bg-cyber-800/40 border border-cyber-700 rounded-md p-4 flex flex-col items-center text-center">
    <div className="text-cyber-400 mb-2">{icon}</div>
    <div className="text-xs text-cyber-400 uppercase tracking-wide font-medium">
      {label}
    </div>
    <div className="text-xl text-cyber-100 font-bold mt-1">{value}</div>
  </div>
)

interface AISummaryProps {
  summary: string
  onClose: () => void
}

const AISummary: React.FC<AISummaryProps> = ({ summary, onClose }) => {
  // Use more robust regex to extract stats from the markdown
  const totalCheckedMatch = summary.match(/Total\s+(?:Accounts\s+)?Checked:\s*\**\s*(\d+)/i)
  const totalPwnedMatch = summary.match(/Total\s+(?:Accounts\s+)?Pwned:\s*\**\s*(\d+)/i)
  const totalChecked = totalCheckedMatch ? totalCheckedMatch[1] : '-'
  const totalPwned = totalPwnedMatch ? totalPwnedMatch[1] : '-'
  const hasPwned = totalPwned !== '-' && parseInt(totalPwned) > 0
  const severity = hasPwned ? 'High' : 'Low'
  const cleanedSummary = summary
  // Remove the H1 title (lines starting with "# ")
  .replace(/^# .*\n+/i, '')
  // Remove the Stats section until the next heading or section
  .replace(/### Stats[\s\S]*?(?=###|$)/i, '')
  .trim();

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High':
        return 'text-red-400'
      case 'Low':
        return 'text-green-400'
      default:
        return 'text-yellow-400'
    }
  }

  return (
    <div className="bg-cyber-900/50 border border-cyber-700 rounded-lg p-6 shadow-lg relative">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl text-cyber-100 font-bold flex items-center gap-3">
          <ShieldCheckIcon className="h-7 w-7 text-cyber-400" />
          <span>AI Security Report</span>
        </h3>
        <button
          onClick={onClose}
          className="p-2 text-sm text-cyber-300 hover:text-cyber-100 transition-colors duration-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatBox
          label="Accounts Checked"
          value={totalChecked}
          icon={<UserGroupIcon className="h-6 w-6" />}
        />
        <StatBox
          label="Accounts Pwned"
          value={totalPwned}
          icon={<ExclamationCircleIcon className="h-6 w-6" />}
        />
        <StatBox
          label="Severity"
          value={severity}
          icon={
            <span className={`${getSeverityColor(severity)}`}>
              <ExclamationCircleIcon className="h-6 w-6" />
            </span>
          }
        />
      </div>

      <div
  className="prose prose-invert max-w-none text-sm leading-relaxed text-cyber-200
             [&_strong]:font-bold [&_strong]:text-cyber-100
             [&_b]:font-bold [&_b]:text-cyber-100
             [&_p]:mb-3 [&_ul]:mb-3 [&_ol]:mb-3 [&_li]:mb-1
             [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-cyber-100 [&_h3]:mt-4 [&_h3]:mb-2
             [&_table]:w-full [&_table]:table-auto
             [&_th]:text-left [&_td]:align-top
             [&_th]:border-b [&_th]:border-cyber-700
             [&_td]:py-2 [&_th]:py-2
             [&_a]:text-cyber-400 [&_a]:hover:underline"
>
  <ReactMarkdown remarkPlugins={[remarkGfm]}>
    {cleanedSummary || ''}
  </ReactMarkdown>
</div>
    </div>
  )
}

export default AISummary