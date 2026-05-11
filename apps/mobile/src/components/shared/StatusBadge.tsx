import { View, Text } from 'react-native';
import { ProjectStatus, TaskStatus } from '@lumicore/shared-types';

type AnyStatus = ProjectStatus | TaskStatus;

const PROJECT_COLORS: Record<ProjectStatus, { bg: string; text: string }> = {
  [ProjectStatus.Hinnapakkumises]: { bg: 'bg-amber-100',  text: 'text-amber-800' },
  [ProjectStatus.Ettevalmistuses]: { bg: 'bg-blue-100',   text: 'text-blue-800'  },
  [ProjectStatus.Toos]:            { bg: 'bg-green-100',  text: 'text-green-800' },
  [ProjectStatus.Lopetatud]:       { bg: 'bg-gray-100',   text: 'text-gray-700'  },
};

const TASK_COLORS: Record<TaskStatus, { bg: string; text: string }> = {
  [TaskStatus.Uus]:    { bg: 'bg-slate-200',  text: 'text-slate-700'  },
  [TaskStatus.Teha]:   { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  [TaskStatus.Toos]:   { bg: 'bg-blue-100',   text: 'text-blue-800'   },
  [TaskStatus.Tehtud]: { bg: 'bg-green-100',  text: 'text-green-800'  },
};

function getColors(status: AnyStatus) {
  if (status in PROJECT_COLORS) return PROJECT_COLORS[status as ProjectStatus];
  if (status in TASK_COLORS)   return TASK_COLORS[status as TaskStatus];
  return { bg: 'bg-gray-200', text: 'text-gray-700' };
}

interface Props {
  status: AnyStatus;
  /** Display label — defaults to the status value itself */
  label?: string;
}

export function StatusBadge({ status, label }: Props) {
  const { bg, text } = getColors(status);
  return (
    <View className={`rounded-full px-2.5 py-0.5 ${bg}`}>
      <Text className={`text-xs font-medium ${text}`}>{label ?? status}</Text>
    </View>
  );
}
