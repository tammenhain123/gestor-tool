import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Unique,
} from "typeorm";
import { Project } from "./project.entity";

@Entity("indicators")
@Unique(["projectId"])
export class Indicator {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  projectId!: string;

  @ManyToOne(() => Project, { nullable: true, onDelete: "CASCADE" })
  project?: Project;

  @Column({ type: "jsonb", nullable: true })
  data?: any;

  @CreateDateColumn({ type: "timestamp with time zone" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp with time zone" })
  updatedAt!: Date;
}
