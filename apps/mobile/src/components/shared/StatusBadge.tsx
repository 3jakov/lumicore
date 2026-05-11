import { View, Text } from 'react-native';
import { ProjectStatus, TaskStatus } from '@lumicore/shared-types';

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

interface ProjectBadgeProps {
  kind: 'project';
  status: ProjectStatus;
  label?: string;
}

interface TaskBadgeProps {
  kind: 'task';
  status: TaskStatus;
  label?: string;
}

type Props = ProjectBadgeProps | TaskBadgeProps;

export function StatusBadge(props: Props) {
  const colors =
    props.kind === 'project'
      ? PROJECT_COLORS[props.status]
      : TASK_COLORS[props.status];

  return (
    <View className={`rounded-full px-2.5 py-0.5 ${colors.bg}`}>
      <Text className={`text-xs font-medium ${colors.text}`}>
        {props.label ?? props.status}
      </Text>
    </View>
  );
}
