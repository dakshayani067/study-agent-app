import { Navbar } from '../components/navbar';
import { ConceptCard } from './concept-card';
import { createClient } from '../../lib/supabase';

interface Concept {
  id?: string;
  subject: string;
  concept: string;
  mastery_level: 'Introduced' | 'Developing' | 'Proficient' | 'Strong';
  strong_areas?: string[];
  weak_areas?: string[];
  next_steps?: string[];
  last_updated?: string;
}

async function fetchConcepts(): Promise<Concept[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('concepts')
    .select('*')
    .order('last_updated', { ascending: false });

  if (error) {
    console.warn('Supabase fetchConcepts failed — check SUPABASE keys and config');
    return [];
  }

  return data || [];
}

function calculateMasteryScore(mastery_level: string): number {
  switch (mastery_level) {
    case 'Strong':
      return 4;
    case 'Proficient':
      return 3;
    case 'Developing':
      return 2;
    case 'Introduced':
      return 1;
    default:
      return 0;
  }
}

export default async function DashboardPage() {
  const concepts = await fetchConcepts();

  // Calculate stats
  const totalConcepts = concepts.length;
  const uniqueSubjects = new Set(concepts.map((c) => c.subject)).size;
  const averageMasteryScore =
    concepts.length > 0
      ? (concepts.reduce(
          (sum, c) => sum + calculateMasteryScore(c.mastery_level),
          0
        ) /
          concepts.length /
          4) *
        100
      : 0;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="text-gray-400 text-sm font-medium">
              Total Concepts
            </div>
            <div className="text-4xl font-bold mt-2">{totalConcepts}</div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="text-gray-400 text-sm font-medium">
              Unique Subjects
            </div>
            <div className="text-4xl font-bold mt-2">{uniqueSubjects}</div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="text-gray-400 text-sm font-medium">
              Average Mastery
            </div>
            <div className="text-4xl font-bold mt-2">
              {Math.round(averageMasteryScore)}%
            </div>
            <div className="mt-3 w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${averageMasteryScore}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Concepts Grid */}
        {concepts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">
              No concepts studied yet. Start learning in the chat!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {concepts.map((concept) => (
              <ConceptCard key={concept.concept} concept={concept} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
