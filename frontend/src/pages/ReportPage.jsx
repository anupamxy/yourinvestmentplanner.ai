import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import Layout from '../components/layout/Layout';
import ReportViewer from '../components/reports/ReportViewer';
import ReportQA from '../components/reports/ReportQA';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { reportApi } from '../api/reportApi';

export default function ReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    reportApi.get(id)
      .then(({ data }) => { setReport(data); setLoading(false); })
      .catch(() => { navigate('/dashboard'); });
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Delete this report permanently?')) return;
    setDeleting(true);
    await reportApi.delete(id);
    navigate('/dashboard');
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/dashboard" className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white transition-colors">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          {report && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1 text-sm text-red-400 hover:text-red-600 transition-colors"
            >
              <Trash2 size={15} /> {deleting ? 'Deleting...' : 'Delete'}
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner text="Loading report..." />
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
