
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, authApi } from "@/lib/api";
import { Loader2, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EditProfileDialogProps {
    user: User;
    onUpdate: (updatedUser: User) => void;
}

export function EditProfileDialog({ user, onUpdate }: EditProfileDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        full_name: user.full_name || "",
        bio: user.bio || "",
        location: user.location || "",
        website_url: user.website_url || "",
        github_url: user.github_url || "",
        linkedin_url: user.linkedin_url || "",
        avatar_url: user.avatar_url || "",
    });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const updatedUser = await authApi.updateProfile(formData);
            onUpdate(updatedUser);
            toast({
                title: "Profile updated",
                description: "Your profile has been successfully updated.",
            });
            setOpen(false);
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to update profile. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Profile
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>
                        Make changes to your profile here. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input
                            id="full_name"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            placeholder="Your full name"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                            id="bio"
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            placeholder="Tell us a little about yourself"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                            id="location"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="City, Country"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="website_url">Website</Label>
                        <Input
                            id="website_url"
                            name="website_url"
                            value={formData.website_url}
                            onChange={handleChange}
                            placeholder="https://your-website.com"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="github_url">GitHub</Label>
                            <Input
                                id="github_url"
                                name="github_url"
                                value={formData.github_url}
                                onChange={handleChange}
                                placeholder="GitHub Username/URL"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="linkedin_url">LinkedIn</Label>
                            <Input
                                id="linkedin_url"
                                name="linkedin_url"
                                value={formData.linkedin_url}
                                onChange={handleChange}
                                placeholder="LinkedIn Profile URL"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="avatar_url">Avatar URL</Label>
                        <Input
                            id="avatar_url"
                            name="avatar_url"
                            value={formData.avatar_url}
                            onChange={handleChange}
                            placeholder="https://example.com/avatar.png"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
