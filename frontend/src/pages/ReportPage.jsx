import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Loader2 } from 'lucide-react';
import Layout from '../components/layout/Layout';
import ReportViewer from '../components/reports/ReportViewer';
import ReportQA from '../components/reports/ReportQA';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { reportApi } from '../api/reportApi';

export default function ReportPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [report,   setReport]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    reportApi.get(id)
      .then(({ data }) => { setReport(data); setLoading(false); })
      .catch(() => navigate('/dashboard'));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Delete this report permanently?')) return;
    setDeleting(true);
    await reportApi.delete(id);
    navigate('/dashboard');
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-1">

        {/* Top bar */}
        <div className="flex items-center justify-between py-2">
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 text-[13px] text-[var(--text-muted)]
                       hover:text-[var(--text-primary)] transition-colors group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to Dashboard
          </Link>

          {report && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 text-[13px] font-medium
                         text-[var(--text-muted)] hover:text-red-400
                         transition-colors disabled:opacity-50"
            >
              {deleting
                ? <Loader2 size={13} className="animate-spin" />
                : <Trash2 size={13} />
              }
              {deleting ? 'Deleting…' : 'Delete Report'}
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-24 flex justify-center">
            <LoadingSpinner text="Loading report…" />
          </div>
        ) : (
          <>
            <ReportViewer report={report} />
            <ReportQA reportId={id} />
          </>
        )}
      </div>
    </Layout>
  );
}
